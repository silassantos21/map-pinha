import { z } from "zod";

export const poiFormSchema = z
  .object({
    name: z.string().min(1, "Dê um nome ao Marcador").max(200),
    description: z.string().max(2000).optional().or(z.literal("")),
    address: z.string().min(1, "Informe o endereço").max(500),
    categoryId: z.string().min(1, "Selecione uma categoria"),
    visibility: z.enum(["public", "followers", "group", "private"]),
    // Só obrigatório quando `visibility === "group"` — ver `.refine` abaixo.
    groupId: z.string().nullable().optional(),
  })
  .refine((data) => data.visibility !== "group" || !!data.groupId, {
    message: "Escolha um grupo",
    path: ["groupId"],
  });

export type PoiFormValues = z.infer<typeof poiFormSchema>;
