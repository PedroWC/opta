import { Activity } from "../domain/activity/activity.ts";
import { Presumption } from "../domain/presumption/presumption.ts";
import { TaxRate } from "../domain/shared/tax-rate.ts";
import { FixedAnnexActivity, PayrollFactorActivity } from "../domain/simples/simples-activity.ts";

/**
 * Catálogo provisório de atividades do MVP (⚠️ conferir descrições e enquadramento). Será substituído
 * pela tabela ATIVIDADE_CNAE (issue #3). Comércio não tem regra de Simples (Anexo I fica fora do MVP).
 */
export class ActivityReferenceCatalog {
  all(): readonly Activity[] {
    const services = new Presumption("SERVICE", TaxRate.fromPercentage("32"), TaxRate.fromPercentage("32"));
    const commerce = new Presumption("COMMERCE", TaxRate.fromPercentage("8"), TaxRate.fromPercentage("12"));
    const payrollFactor = (cnae: string, description: string): Activity =>
      new Activity(cnae, description, "SERVICE", new PayrollFactorActivity(), services);
    const annexIII = (cnae: string, description: string): Activity =>
      new Activity(cnae, description, "SERVICE", new FixedAnnexActivity("III"), services);
    const retail = (cnae: string, description: string): Activity =>
      new Activity(cnae, description, "COMMERCE", null, commerce);

    return [
      payrollFactor("6201-5/01", "Desenvolvimento de programas de computador sob encomenda"),
      payrollFactor("6201-5/02", "Web design"),
      payrollFactor("6202-3/00", "Desenvolvimento e licenciamento de programas de computador customizáveis"),
      payrollFactor("6203-1/00", "Desenvolvimento e licenciamento de programas de computador não customizáveis"),
      payrollFactor("6204-0/00", "Consultoria em tecnologia da informação"),
      payrollFactor("6209-1/00", "Suporte técnico, manutenção e outros serviços em tecnologia da informação"),
      payrollFactor("6311-9/00", "Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem na internet"),
      annexIII("8630-5/04", "Atividade odontológica"),
      annexIII("9602-5/01", "Cabeleireiros, manicure e pedicure"),
      annexIII("6920-6/01", "Atividades de contabilidade"),
      retail("4711-3/02", "Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - supermercados"),
      retail("4781-4/00", "Comércio varejista de artigos do vestuário e acessórios"),
      retail("4761-0/03", "Comércio varejista de artigos de papelaria"),
    ];
  }
}
