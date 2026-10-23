import { z } from "zod";

export const poiFormSchema = z.object({
  name: z.string().min(1, "Dê um nome ao POI").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  address: z.string().min(1, "Informe o endereço").max(500),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  isPublic: z.boolean(),
});

export type PoiFormValues = z.infer<typeof poiFormSchema>;
