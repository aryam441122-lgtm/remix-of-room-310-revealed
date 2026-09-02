import bgApartment from "@/assets/bg-apartment.jpg";
import bgDrive from "@/assets/bg-drive.jpg";
import bgLobby from "@/assets/bg-lobby.jpg";
import bgHallway from "@/assets/bg-hallway.jpg";
import bgRoom310 from "@/assets/bg-room310.jpg";
import bgRoom310b from "@/assets/bg-room310b.jpg";
import bgSecurity from "@/assets/bg-security.jpg";
import bgBasement from "@/assets/bg-basement.jpg";
import bgArchive from "@/assets/bg-archive.jpg";
import bgBallroom from "@/assets/bg-ballroom.jpg";
import bgRooftop from "@/assets/bg-rooftop.jpg";

import pDaniel from "@/assets/char-daniel.png";
import pClaire from "@/assets/char-claire.png";
import pVictor from "@/assets/char-victor.png";
import pMaya from "@/assets/char-maya.png";
import pElias from "@/assets/char-elias.png";
import pNoah from "@/assets/char-noah.png";

import type { CharacterId } from "./types";

export const backgrounds: Record<string, string> = {
  apartment: bgApartment,
  drive: bgDrive,
  lobby: bgLobby,
  hallway: bgHallway,
  hallway_red: bgHallway,
  room310: bgRoom310,
  room310b: bgRoom310b,
  security: bgSecurity,
  basement: bgBasement,
  archive: bgArchive,
  ballroom: bgBallroom,
  rooftop: bgRooftop,
};

export const portraits: Partial<Record<CharacterId, string>> = {
  daniel: pDaniel,
  claire: pClaire,
  victor: pVictor,
  maya: pMaya,
  elias: pElias,
  noah: pNoah,
};

export const coverImage = bgRoom310;
