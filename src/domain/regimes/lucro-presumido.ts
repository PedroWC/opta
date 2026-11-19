import { ActivitySalesTax } from "../taxes/activity-sales-tax.ts";
import { CbsStrategy } from "../taxes/cbs-strategy.ts";
import { CppStrategy } from "../taxes/cpp-strategy.ts";
import { CsllStrategy } from "../taxes/csll-strategy.ts";
import { IbsStrategy } from "../taxes/ibs-strategy.ts";
import { IcmsStrategy } from "../taxes/icms-strategy.ts";
import { IrpjStrategy } from "../taxes/irpj-strategy.ts";
import { IssStrategy } from "../taxes/iss-strategy.ts";
import { PisCofinsStrategy } from "../taxes/pis-cofins-strategy.ts";
import type { TaxStrategy } from "../taxes/tax-strategy.ts";
import { TaxRegime } from "./tax-regime.ts";

/** Lucro Presumido (RN-07): IRPJ, CSLL e CPP próprios, mais os tributos sobre o consumo no regime regular. */
export class LucroPresumido extends TaxRegime {
  readonly name = "LUCRO_PRESUMIDO";

  protected taxes(): readonly TaxStrategy[] {
    return [
      new IrpjStrategy(),
      new CsllStrategy(),
      new CppStrategy(),
      new PisCofinsStrategy(),
      new CbsStrategy(),
      new IbsStrategy(),
      new ActivitySalesTax(new IssStrategy(), new IcmsStrategy()),
    ];
  }
}
