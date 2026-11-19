import type { TransitionRates } from "../ports/tax-rate-table-repository.ts";
import { Money } from "../shared/money.ts";
import { TaxRate } from "../shared/tax-rate.ts";
import type { DasShares } from "../simples/das-partition.ts";
import { TaxLine } from "./tax-line.ts";

/**
 * Compõe a memória de partilha do DAS ano a ano. O total do DAS não muda com a Reforma; muda a
 * composição: a parcela de PIS/Cofins vira CBS a partir de 2027 e a de ISS cede ao IBS a fração
 * que deixa de vigorar (RN-02). ⚠️ Conferir o tratamento do DAS na LC 214/2025.
 */
export class DasComposition {
  breakdown(shares: DasShares, transition: TransitionRates, base: Money): TaxLine[] {
    const lines: TaxLine[] = [];
    const add = (code: string, amount: Money, source: string): void => {
      if (amount.equals(Money.zero())) return;
      lines.push(new TaxLine(code, base, TaxRate.fromRatio(amount.inCents(), base.inCents()), amount, source));
    };
    add("IRPJ", shares.IRPJ, "LC 123/2006: partilha do DAS");
    add("CSLL", shares.CSLL, "LC 123/2006: partilha do DAS");
    add("CPP", shares.CPP, "LC 123/2006: partilha do DAS");

    const pisCofins = shares.PIS.add(shares.COFINS);
    if (transition.pisCofinsExtinct) {
      add("CBS", pisCofins, "LC 214/2025: parcela de PIS/Cofins do DAS substituída pela CBS");
    } else {
      add("PIS_COFINS", pisCofins, "LC 123/2006: partilha do DAS (PIS e Cofins)");
    }

    const issKept = shares.ISS.multiplyByRatio(BigInt(transition.icmsIssPercentageInForce), 100n);
    add("ISS", issKept, "LC 123/2006: partilha do DAS (parcela de ISS ainda vigente)");
    add("IBS", shares.ISS.subtract(issKept), "LC 214/2025: parcela de ISS do DAS substituída pelo IBS");
    return lines;
  }
}
