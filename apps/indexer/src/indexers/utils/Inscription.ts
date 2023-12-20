/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable consistent-return */
import { OrdInscription, RawTransaction } from "@ordzaar/rpcservices";
import { PrismaClient } from "@prisma/client";
import { ITXClientDenyList, Omit } from "@prisma/client/runtime/library";
import { networks } from "bitcoinjs-lib";

import { VinData } from "../types";
import { Envelope } from "./Envelope";
import { parseLocation } from "./Transaction";

export async function getInscriptionEpochBlock(network: networks.Network): Promise<number> {
  switch (network) {
    case networks.bitcoin:
      return 767_429;
    case networks.testnet:
      return 2_413_342;
    default:
      return 0;
  }
}

export class Inscription {
  readonly id: string;

  readonly parent?: string;

  readonly children?: string[];

  readonly genesis: string;

  readonly creator: string;

  readonly owner: string;

  readonly media: InscriptionMedia;

  readonly number: number;

  readonly sequence: number;

  readonly height: number;

  readonly fee: number;

  readonly sat: number;

  readonly outpoint: string;

  readonly timestamp: number;

  readonly meta?: Object;

  readonly oip?: Object;

  constructor(data: InscriptionData) {
    this.id = data.id;
    this.parent = data.parent;
    this.children = data.children;
    this.genesis = data.genesis;
    this.creator = data.creator;
    this.owner = data.owner;
    this.media = data.media;
    this.number = data.number;
    this.sequence = data.sequence;
    this.height = data.height;
    this.fee = data.fee;
    this.sat = data.sat;
    this.outpoint = data.outpoint;
    this.timestamp = data.timestamp;
    this.meta = data.meta;
    this.oip = data.oip;
  }

  static async fromTransaction(tx: RawTransaction): Promise<Envelope | undefined> {
    const envelope = Envelope.fromTransaction(tx);
    if (envelope && envelope.isValid) {
      return envelope;
    }
    return undefined;
  }

  static async fromVin(vin: VinData): Promise<Envelope | undefined> {
    const envelope = Envelope.fromTxinWitness(vin.txid, vin.witness);
    if (envelope && envelope.isValid) {
      return envelope;
    }
    return undefined;
  }
}

type InscriptionData = {
  id: string;
  parent?: string;
  children?: string[];
  genesis: string;
  creator: string;
  owner: string;
  media: InscriptionMedia;
  number: number;
  sequence: number;
  height: number;
  fee: number;
  sat: number;
  outpoint: string;
  timestamp: number;
  meta: Object;
  oip?: Object;
};

type InscriptionMedia = {
  type: string;
  charset: string;
  mime: {
    type: string;
    subtype: string;
  };
  content: Buffer;
  size: number;
};

export async function getInscriptionFromEnvelope(
  prismaTx: Omit<PrismaClient, ITXClientDenyList>,
  envelope: Envelope,
  ord: Map<string, OrdInscription>,
): Promise<Inscription | undefined> {
  const ordData = ord.get(envelope.id);
  if (ordData === undefined) {
    return undefined;
  }

  const [locationTxid, locationN] = parseLocation(ordData.satpoint);

  return new Inscription({
    id: envelope.id,
    parent: envelope.parent,
    children: [],
    genesis: envelope.txid,
    creator: await getInscriptionCreator(prismaTx, envelope.txid),
    owner: await getInscriptionOwner(prismaTx, locationTxid, locationN),
    media: {
      type: envelope.media.type ?? "",
      charset: envelope.media.charset,
      mime: {
        type: envelope.media.mimeType,
        subtype: envelope.media.mimeSubtype,
      },
      content: envelope.content?.body ?? Buffer.alloc(0),
      size: envelope.content?.size ?? 0,
    },
    number: ordData.number,
    sequence: ordData.sequence,
    height: ordData.genesis_height,
    fee: ordData.genesis_fee,
    sat: ordData.sat,
    outpoint: `${locationTxid}:${locationN}`,
    timestamp: ordData.timestamp,
    meta: envelope.meta,
    oip: envelope.oip,
  });
}

async function getInscriptionCreator(prismaTx: Omit<PrismaClient, ITXClientDenyList>, txid: string) {
  const data = await prismaTx.output.findUnique({
    where: {
      voutTxid_voutTxIndex: {
        voutTxid: txid,
        voutTxIndex: 0,
      },
    },
  });
  return data?.addresses[0] ?? "";
}

async function getInscriptionOwner(prismaTx: Omit<PrismaClient, ITXClientDenyList>, txid: string, n: number) {
  const data = await prismaTx.output.findUnique({
    where: {
      voutTxid_voutTxIndex: {
        voutTxid: txid,
        voutTxIndex: n,
      },
    },
  });
  return data?.addresses[0] ?? "";
}
