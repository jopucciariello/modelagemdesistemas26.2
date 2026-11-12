// RF30, RF03: starter catalog from docs/requisitos.md §4. The admin loads it once and edits it.
export type DefaultPlan = { name: string; intervalKm?: number; intervalHours?: number; action: "REPLACE" | "SERVICE" };
export type DefaultCategory = {
  name: string;
  wearsOnTrainer: boolean; // RB14
  plans: DefaultPlan[];
  components: { brand: string; model: string }[];
};

const replaceKm = (name: string, km: number): DefaultPlan => ({ name, intervalKm: km, action: "REPLACE" });
const serviceH = (name: string, h: number): DefaultPlan => ({ name, intervalHours: h, action: "SERVICE" });

export const DEFAULT_CATALOG: DefaultCategory[] = [
  { name: "Corrente", wearsOnTrainer: true, plans: [replaceKm("Troca", 3000)], components: [{ brand: "Shimano", model: "CN-M8100" }, { brand: "SRAM", model: "PC-1110" }] },
  { name: "Cassete", wearsOnTrainer: true, plans: [replaceKm("Troca", 9000)], components: [{ brand: "Shimano", model: "CS-M8100" }, { brand: "SRAM", model: "XG-1275" }] },
  { name: "Coroas", wearsOnTrainer: true, plans: [replaceKm("Troca", 15000)], components: [{ brand: "Shimano", model: "SM-CRM85" }] },
  { name: "Pneu de estrada", wearsOnTrainer: false, plans: [replaceKm("Troca", 4000)], components: [{ brand: "Continental", model: "Grand Prix 5000" }] },
  { name: "Pneu de MTB", wearsOnTrainer: false, plans: [replaceKm("Troca", 2500)], components: [{ brand: "Maxxis", model: "Minion DHF" }] },
  { name: "Pastilha de freio", wearsOnTrainer: false, plans: [replaceKm("Troca", 1500)], components: [{ brand: "Shimano", model: "G05S" }] },
  { name: "Cabo e conduíte", wearsOnTrainer: true, plans: [replaceKm("Troca", 5000)], components: [{ brand: "Shimano", model: "OT-SP41" }] },
  {
    name: "Garfo",
    wearsOnTrainer: false,
    plans: [serviceH("Revisão de lowers (óleo e retentores)", 50), serviceH("Revisão completa (damper)", 125)],
    components: [{ brand: "RockShox", model: "Pike" }, { brand: "Fox", model: "34" }],
  },
  {
    name: "Amortecedor",
    wearsOnTrainer: false,
    plans: [serviceH("Revisão da câmara de ar", 50), serviceH("Revisão completa", 125)],
    components: [{ brand: "RockShox", model: "Deluxe" }, { brand: "Fox", model: "Float X" }],
  },
  { name: "Canote retrátil", wearsOnTrainer: false, plans: [serviceH("Revisão", 200)], components: [{ brand: "RockShox", model: "Reverb AXS" }] },
  { name: "Rolamentos de pivô", wearsOnTrainer: false, plans: [serviceH("Revisão/troca", 100)], components: [{ brand: "Genérico", model: "Kit de rolamentos" }] },
  { name: "Fluido de freio", wearsOnTrainer: false, plans: [serviceH("Sangria", 100)], components: [{ brand: "Shimano", model: "Mineral Oil" }] },
];
