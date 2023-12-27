export type GetSpendablesDto = {
  address: string;
  value: number;
  safetospend?: boolean;
  filter?: string[];
};
