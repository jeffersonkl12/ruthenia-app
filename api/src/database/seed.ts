/**
 * Seed de exemplo — mundo base de Ruthenia.
 *
 *   bun run db:push     # cria/atualiza as tabelas a partir dos schemas
 *   bun run db:seed      # popula o mundo base (não faz nada se já existir)
 *   bun run db:seed --reset   # LIMPA todo o banco e recria a seed
 *
 * O objetivo é ter um cenário coeso e pequeno para testar a API e servir de
 * exemplo — 1 reino, 2 regiões, uma cidadela com sub-locais, 1 party e 5
 * personagens (incluindo 1 jogador).
 */
import "dotenv/config";
import { client, db } from "@/database";
import {
  characters,
  entities,
  kingdoms,
  locations,
  parties,
  regions,
} from "@/database/schemas";
import {
  characterService,
  kingdomService,
  locationService,
  partyService,
  regionService,
} from "@/service";

/** Nome do reino usado como marcador de "banco já semeado". */
const SEED_MARKER = "Valdheim";

async function wipeAll(): Promise<void> {
  // FK off para poder apagar em lote (locations tem auto-referência).
  await client.execute("PRAGMA foreign_keys = OFF");
  await db.delete(characters);
  await db.delete(entities);
  await db.delete(parties);
  await db.delete(locations);
  await db.delete(regions);
  await db.delete(kingdoms);
  await client.execute("DELETE FROM sqlite_sequence").catch(() => undefined);
  await client.execute("PRAGMA foreign_keys = ON");
}

async function buildWorld() {
  const kingdom = await kingdomService.create({
    name: SEED_MARKER,
    status: "PEACE",
  });

  const pedralida = await regionService.create({
    name: "Vale de Pedrálida",
    biome: "MOUNTAINS",
    status: "STABLE",
    wealth: 40,
    infrastructure: 35,
    kingdomId: kingdom.id,
  });

  const bruma = await regionService.create({
    name: "Marca de Bruma",
    biome: "SWAMP",
    status: "UNREST",
    wealth: 15,
    infrastructure: 10,
    kingdomId: kingdom.id,
  });

  // --- Locais do Vale de Pedrálida (árvore de 3 níveis) ---
  const correnthal = await locationService.create({
    name: "Cidadela de Correnthal",
    type: "city",
    regionId: pedralida.id,
    parentId: null,
  });

  const pracaMartelo = await locationService.create({
    name: "Praça do Martelo",
    type: "district",
    regionId: pedralida.id,
    parentId: correnthal.id,
  });

  const corvoCansado = await locationService.create({
    name: "Taverna O Corvo Cansado",
    type: "tavern",
    regionId: pedralida.id,
    parentId: pracaMartelo.id,
  });

  const forjaGrael = await locationService.create({
    name: "Forja dos Irmãos Grael",
    type: "smithy",
    regionId: pedralida.id,
    parentId: pracaMartelo.id,
  });

  const pedraAlta = await locationService.create({
    name: "Castelo Pedra-Alta",
    type: "castle",
    regionId: pedralida.id,
    parentId: correnthal.id,
  });

  // --- Locais da Marca de Bruma ---
  const postoVaugrim = await locationService.create({
    name: "Posto de Vaugrim",
    type: "outpost",
    regionId: bruma.id,
    parentId: null,
  });

  const party = await partyService.create({
    name: "Os Errantes do Corvo",
    kingdomId: kingdom.id,
  });

  // --- Personagens ---
  await characterService.create({
    name: "Kaelen Vharr",
    age: 27,
    gender: "MALE",
    race: "HUMAN",
    socialStatus: "COMMONER",
    isPlayer: true,
    occupation: "mercenário",
    personality: "Reservado, leal a quem merece, avesso a nobres.",
    appearance: "Alto e magro, cicatriz no queixo, capa cinza puída.",
    background:
      "Cresceu nas minas de Pedrálida; virou espada de aluguel depois que a galeria principal desabou.",
    kingdomId: kingdom.id,
    partyId: party.id,
    currentRegionId: pedralida.id,
    currentLocationId: corvoCansado.id,
  });

  await characterService.create({
    name: "Bruna Sétepunhos",
    age: 30,
    gender: "FEMALE",
    race: "HUMAN",
    socialStatus: "COMMONER",
    occupation: "batedora",
    personality: "Impaciente, afiada no sarcasmo, primeira a farejar encrenca.",
    appearance: "Baixa e ágil, cabelo raspado dos lados, arco curto às costas.",
    background:
      "Ex-contrabandista da Marca de Bruma; conhece toda trilha do pântano.",
    kingdomId: kingdom.id,
    partyId: party.id,
    currentRegionId: pedralida.id,
    currentLocationId: corvoCansado.id,
  });

  await characterService.create({
    name: "Sior Adelric Grael",
    age: 44,
    gender: "MALE",
    race: "HUMAN",
    socialStatus: "MERCHANT",
    occupation: "mestre-ferreiro",
    personality: "Falastrão, orgulhoso do ofício, generoso com aprendizes.",
    appearance: "Braços grossos, barba chamuscada, avental de couro rachado.",
    background:
      "Herdou a forja do pai; arma metade da guarda da cidadela de Correnthal.",
    kingdomId: kingdom.id,
    currentRegionId: pedralida.id,
    currentLocationId: forjaGrael.id,
  });

  await characterService.create({
    name: "Irmã Neve",
    age: 33,
    gender: "FEMALE",
    race: "HUMAN",
    socialStatus: "CLERGY",
    occupation: "curandeira",
    personality: "Calma, direta, sem paciência para superstição.",
    appearance: "Hábito branco, mãos calejadas, olhar cansado.",
    background:
      "Serve na capela do Castelo Pedra-Alta; cuida dos feridos que voltam das fronteiras.",
    kingdomId: kingdom.id,
    currentRegionId: pedralida.id,
    currentLocationId: pedraAlta.id,
  });

  await characterService.create({
    name: "O Coletor de Bruma",
    age: 51,
    gender: "OTHER",
    race: "HUMAN",
    socialStatus: "NOBLE",
    occupation: "senhor de Vaugrim",
    personality:
      "Cortês, paciente, coleciona dívidas como quem coleciona relíquias.",
    appearance: "Manto encharcado que nunca seca, voz baixa, anéis em excesso.",
    background:
      "Controla o Posto de Vaugrim e as passagens da Marca de Bruma; ninguém lembra de tê-lo visto chegar.",
    kingdomId: kingdom.id,
    currentRegionId: bruma.id,
    currentLocationId: postoVaugrim.id,
  });

  return { kingdom: kingdom.name, regions: 2, locations: 6, parties: 1, characters: 5 };
}

async function main(): Promise<void> {
  const reset = process.argv.includes("--reset");
  const alreadySeeded = (await kingdomService.findAll()).some(
    (k) => k.name === SEED_MARKER,
  );

  if (alreadySeeded && !reset) {
    console.log(
      `Banco já contém a seed "${SEED_MARKER}". Use "bun run db:seed --reset" para recriar.`,
    );
    return;
  }

  if (reset) {
    console.log("Limpando o banco…");
    await wipeAll();
  }

  const summary = await buildWorld();
  console.log("Seed concluída:", summary);
}

main()
  .then(() => client.close())
  .catch((error) => {
    console.error(error);
    client.close();
    process.exit(1);
  });
