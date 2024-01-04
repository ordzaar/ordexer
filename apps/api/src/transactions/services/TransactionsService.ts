/* eslint-disable no-param-reassign */
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  BitcoinService,
  DecodedTransaction,
  GetExpandedTransactionOptions,
  isCoinbase,
  RawTransaction,
} from "@ordzaar/bitcoin-service";
import { OrdProvider } from "@ordzaar/ord-service";

import { PrismaService } from "../../PrismaService";
import { ExpandedTransaction, GetTransactionDTO, RelayDTO } from "../models/Transactions";

@Injectable()
export class TransactionsService {
  private readonly logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly rpc: BitcoinService,
    private readonly ord: OrdProvider,
  ) {
    this.logger = new Logger(TransactionsService.name);
  }

  async getTransaction({
    txid,
    options = { ord: false, hex: false, witness: false },
  }: GetTransactionDTO): Promise<ExpandedTransaction> {
    const tx = await this.rpc.getRawTransaction(txid, true);
    return this.getExpandedTransaction(tx, options);
  }

  async relay({ hex, maxFeeRate, validate = false }: RelayDTO): Promise<any> {
    this.logger.log(`relay()`);
    const tx = await this.rpc.decodeRawTransaction(hex);
    if (validate === true) {
      await this.validateUtxos(tx);
    }
    const result = await this.rpc.sendRawTransaction(hex, maxFeeRate);
    if (result === undefined) {
      throw new Error("Transaction not accepted by mempool");
    }

    await this.setSpentUtxos(tx);
    return result;
  }

  async getExpandedTransaction(
    tx: RawTransaction,
    { ord = false, hex = false, witness = false }: GetExpandedTransactionOptions,
  ): Promise<ExpandedTransaction> {
    let fee = 0;
    let coinbase = false;
    const apiUrl = this.configService.get<string>("api.url");

    tx.vin.forEach(async (vin) => {
      if (isCoinbase(vin)) {
        coinbase = true;
        return;
      }

      if (witness === false) {
        delete (vin as any).txinwitness;
      }

      const vinTx: RawTransaction = await this.rpc.getRawTransaction(vin.txid, true);

      (vin as any).value = vinTx.vout[vin.vout].value;
      const addresses: string[] = await this.rpc.getAddressesFromVout(vinTx.vout[vin.vout]);
      [(vin as any).address] = addresses;

      fee += vinTx.vout[vin.vout].value;
    });

    tx.vout.forEach(async (vout) => {
      const outpoint = `${tx.txid}:${vout.n}`;

      const output = await this.prisma.output.findUnique({
        where: {
          voutTxid_voutTxIndex: {
            voutTxid: tx.txid,
            voutTxIndex: vout.n,
          },
        },
      });

      if (ord === true) {
        (vout as any).ordinals = await this.ord.getOrdinals(outpoint);

        const inscriptions = await this.prisma.inscription.findMany({
          where: {
            outputId: output?.id ?? "",
          },
        });
        inscriptions.forEach((inscription) => {
          (inscription as any).mediaContent = `${apiUrl}/content/${inscription.id}`;
        });
        (vout as any).inscriptions = inscriptions;
      }

      if (output?.vinTxid !== null && output?.vinTxIndex !== null) {
        (vout as any).spent = true;
      } else {
        (vout as any).spent = false;
      }

      fee -= vout.value;
    });

    if (hex === false) {
      delete (tx as any).hex;
    }

    (tx as any).fee = coinbase ? 0 : fee;
    (tx as any).blockheight = (await this.rpc.getBlockCount()) - tx.confirmations + 1;

    return tx as ExpandedTransaction;
  }

  async validateUtxos(tx: DecodedTransaction): Promise<void> {
    const errors: {
      missing: string[];
      spent: string[];
    } = {
      missing: [],
      spent: [],
    };

    tx.vin.forEach(async (vin) => {
      const utxo = await this.prisma.output.findUnique({
        where: {
          voutTxid_voutTxIndex: {
            voutTxid: vin.txid,
            voutTxIndex: vin.vout,
          },
        },
      });
      if (utxo === null) {
        errors.missing.push(`${vin.txid}:${vin.vout}`);
        return;
      }
      if (utxo.spent === true || (utxo.vinTxid !== null && utxo.vinTxIndex !== null)) {
        errors.spent.push(`${vin.txid}:${vin.vout}`);
      }
    });

    if (errors.missing.length > 0 || errors.spent.length > 0) {
      throw new Error("Transaction validation failed");
    }
  }

  async setSpentUtxos(tx: DecodedTransaction): Promise<void> {
    tx.vin.forEach(async (vin) => {
      await this.prisma.output.update({
        where: {
          voutTxid_voutTxIndex: {
            voutTxid: vin.txid,
            voutTxIndex: vin.vout,
          },
        },
        data: {
          spent: true,
        },
      });
    });
  }
}
