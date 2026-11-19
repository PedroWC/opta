import { Money } from "../domain/shared/money.ts";
import { TaxRate } from "../domain/shared/tax-rate.ts";
import { DasPartition } from "../domain/simples/das-partition.ts";
import type { SimplesAnnex } from "../domain/simples/simples-annex.ts";
import { SimplesAnnexTable } from "../domain/simples/simples-annex-table.ts";
import { SimplesBracket } from "../domain/simples/simples-bracket.ts";

/** Linha da tabela: teto de RBT12, alíquota nominal, parcela a deduzir e partilha [IRPJ, CSLL, Cofins, PIS, CPP, ISS] em %. */
type Row = readonly [string, string, string, readonly [string, string, string, string, string, string]];

/**
 * Dados de referência do Simples Nacional (LC 123/2006, Anexos III e V). ⚠️ Conferir na fonte antes de
 * publicar. Limitações do MVP: sem o limite de 5% do ISS na 5ª faixa do Anexo III e sem o sublimite
 * estadual. Substituídos por SIMPLES_ANEXO_FAIXA e SIMPLES_REPARTICAO na persistência (issue #3).
 */
export class SimplesReferenceTables {
  private static readonly ANNEX_III: readonly Row[] = [
    ["180000", "6", "0", ["4", "3.5", "12.82", "2.78", "43.4", "33.5"]],
    ["360000", "11.2", "9360", ["4", "3.5", "14.05", "3.05", "43.4", "32"]],
    ["720000", "13.5", "17640", ["4", "3.5", "13.64", "2.96", "43.4", "32.5"]],
    ["1800000", "16", "35640", ["4", "3.5", "13.64", "2.96", "43.4", "32.5"]],
    ["3600000", "21", "125640", ["4", "3.5", "12.82", "2.78", "43.4", "33.5"]],
    ["4800000", "33", "648000", ["35", "15", "16.03", "3.47", "30.5", "0"]],
  ];

  private static readonly ANNEX_V: readonly Row[] = [
    ["180000", "15.5", "0", ["25", "15", "14.1", "3.05", "28.85", "14"]],
    ["360000", "18", "4500", ["23", "15", "14.1", "3.05", "27.85", "17"]],
    ["720000", "19.5", "9900", ["24", "15", "14.92", "3.23", "23.85", "19"]],
    ["1800000", "20.5", "17100", ["21", "15", "15.74", "3.41", "23.85", "21"]],
    ["3600000", "23", "62100", ["23", "12.5", "14.1", "3.05", "23.85", "23.5"]],
    ["4800000", "30.5", "540000", ["35", "15.5", "16.44", "3.56", "29.5", "0"]],
  ];

  tableFor(annex: SimplesAnnex): SimplesAnnexTable {
    const rows = annex === "III" ? SimplesReferenceTables.ANNEX_III : SimplesReferenceTables.ANNEX_V;
    return new SimplesAnnexTable(
      annex,
      rows.map(([upTo, nominal, deduction, shares], index) => this.bracket(index + 1, upTo, nominal, deduction, shares)),
    );
  }

  private bracket(
    position: number,
    upTo: string,
    nominal: string,
    deduction: string,
    shares: Row[3],
  ): SimplesBracket {
    const [irpj, csll, cofins, pis, cpp, iss] = shares;
    return new SimplesBracket(
      position,
      Money.fromText(upTo),
      TaxRate.fromPercentage(nominal),
      Money.fromText(deduction),
      new DasPartition({
        IRPJ: TaxRate.fromPercentage(irpj),
        CSLL: TaxRate.fromPercentage(csll),
        COFINS: TaxRate.fromPercentage(cofins),
        PIS: TaxRate.fromPercentage(pis),
        CPP: TaxRate.fromPercentage(cpp),
        ISS: TaxRate.fromPercentage(iss),
      }),
    );
  }
}
