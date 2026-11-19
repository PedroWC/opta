import { z } from "zod";

// O Zod 4 compila esquemas com `new Function` quando consegue; sob a CSP restritiva (sem 'unsafe-eval', DEC-15) essa
// sondagem seria bloqueada e reportada. `jitless` desliga a compilação e mantém o comportamento idêntico.
z.config({ jitless: true });
