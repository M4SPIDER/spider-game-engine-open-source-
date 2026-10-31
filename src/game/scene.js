/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
export const GAME_WORLD = [
  {
    "id": "env-group",
    "name": "Environment",
    "type": "folder",
    "expanded": true,
    "children": [
      {
        "id": "terrain",
        "name": "Terrain",
        "type": "mesh",
        "color": "#4ade80",
        "visible": true,
        "pos": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "rot": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": {
          "x": 100,
          "y": 1,
          "z": 100
        },
        "tag": "Terrain",
        "layer": "Default",
        "mesh": "SM_AlpineValley_01",
        "mat0": "M_Alpine_RockGrass",
        "mat1": "M_SnowPeak_Blend",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "BlockAll"
      },
      {
        "id": "water",
        "name": "Water",
        "type": "mesh",
        "color": "#38bdf8",
        "visible": true,
        "pos": {
          "x": 12.5,
          "y": -4,
          "z": 45
        },
        "rot": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": {
          "x": 50,
          "y": 1,
          "z": 80
        },
        "tag": "Water",
        "layer": "Water",
        "mesh": "SM_RiverPlane_HQ",
        "mat0": "M_Water_Ocean_SSR",
        "mat1": "M_Water_Foam",
        "anim": "ABP_WaveSim",
        "physics": false,
        "mass": 0,
        "collision": "OverlapAll"
      },
      {
        "id": "trees",
        "name": "Trees",
        "type": "mesh",
        "color": "#4f46e5",
        "visible": true,
        "pos": {
          "x": -18,
          "y": 2,
          "z": 22
        },
        "rot": {
          "x": 0,
          "y": 45,
          "z": 0
        },
        "scale": {
          "x": 1.2,
          "y": 1.2,
          "z": 1.2
        },
        "tag": "Foliage",
        "layer": "Foliage",
        "mesh": "SM_PineCluster_Inst",
        "mat0": "M_PineNeedles_Subsurface",
        "mat1": "M_Bark_Pine",
        "anim": "ABP_WindSway",
        "physics": false,
        "mass": 500,
        "collision": "Foliage"
      },
      {
        "id": "rocks",
        "name": "Rocks",
        "type": "mesh",
        "color": "#a855f7",
        "visible": true,
        "pos": {
          "x": -5.4,
          "y": 0,
          "z": 8.2
        },
        "rot": {
          "x": 4,
          "y": 112,
          "z": 0
        },
        "scale": {
          "x": 1.5,
          "y": 1.5,
          "z": 1.5
        },
        "tag": "Prop",
        "layer": "Default",
        "mesh": "SM_CliffOutcrop_04",
        "mat0": "M_Granite_Mossy",
        "mat1": "M_Detail_Rock",
        "anim": "None",
        "physics": false,
        "mass": 1200,
        "collision": "BlockAll"
      },
      {
        "id": "sky",
        "name": "Sky",
        "type": "sky",
        "color": "#ec4899",
        "visible": true,
        "pos": {
          "x": 0,
          "y": 500,
          "z": 0
        },
        "rot": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Sky",
        "layer": "Skybox",
        "mesh": "BP_VolumetricSkyDome",
        "mat0": "M_Sky_Rayleigh",
        "mat1": "M_Clouds_Volumetric",
        "anim": "ABP_DayNightCycle",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      },
      {
        "id": "lighting",
        "name": "Lighting",
        "type": "sun",
        "color": "#f59e0b",
        "visible": true,
        "pos": {
          "x": 0,
          "y": 300,
          "z": -200
        },
        "rot": {
          "x": 35,
          "y": -42,
          "z": 12
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Light",
        "layer": "Lighting",
        "mesh": "DirectionalLight_Sun",
        "mat0": "LightFunction_Clouds",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      },
      {
        "id": "fog",
        "name": "Fog",
        "type": "cloud",
        "color": "#94a3b8",
        "visible": true,
        "pos": {
          "x": 0,
          "y": 15,
          "z": 50
        },
        "rot": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Atmosphere",
        "layer": "Default",
        "mesh": "ExponentialHeightFog",
        "mat0": "M_VolumetricFog_GodRays",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      },
      {
        "id": "postprocess",
        "name": "Post Process",
        "type": "fx",
        "color": "#64748b",
        "visible": true,
        "pos": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "rot": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "PostProcess",
        "layer": "Default",
        "mesh": "PostProcessVolume_Global",
        "mat0": "LUT_FantasyCinematic",
        "mat1": "M_Bloom_ACES",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      }
    ]
  },
  {
    "id": "char-group",
    "name": "Characters",
    "type": "char-folder",
    "expanded": true,
    "children": [
      {
        "id": "player",
        "name": "PlayerCharacter",
        "type": "character",
        "color": "#3b82f6",
        "visible": true,
        "pos": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "rot": {
          "x": 0,
          "y": 180,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Player",
        "layer": "Default",
        "mesh": "SK_Player",
        "mat0": "M_Player_Body",
        "mat1": "M_Player_Cloth",
        "anim": "ABP_Player",
        "physics": true,
        "mass": 70,
        "collision": "Character"
      },
      {
        "id": "camera",
        "name": "Camera",
        "type": "camera",
        "color": "#3b82f6",
        "visible": true,
        "pos": {
          "x": 0,
          "y": 2.2,
          "z": -4.5
        },
        "rot": {
          "x": 10,
          "y": 180,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "MainCamera",
        "layer": "Default",
        "mesh": "CineCameraActor",
        "mat0": "Lens_35mm_Prime",
        "mat1": "None",
        "anim": "ABP_CameraFollow",
        "physics": false,
        "mass": 1,
        "collision": "Camera"
      },
      {
        "id": "weapon",
        "name": "Weapon",
        "type": "weapon",
        "color": "#6366f1",
        "visible": true,
        "pos": {
          "x": 0.35,
          "y": 1.1,
          "z": 0.15
        },
        "rot": {
          "x": 0,
          "y": 90,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Weapon",
        "layer": "Equipment",
        "mesh": "SK_TacticalRifle_MK2",
        "mat0": "M_Weapon_Carbon",
        "mat1": "M_Weapon_Optics",
        "anim": "ABP_WeaponRecoil",
        "physics": false,
        "mass": 4.5,
        "collision": "NoCollision"
      }
    ]
  },
  {
    "id": "props-group",
    "name": "Props",
    "type": "folder",
    "expanded": true,
    "children": [
      {
        "id": "buildings",
        "name": "Buildings",
        "type": "sub-folder",
        "color": "#f59e0b",
        "visible": true,
        "pos": {
          "x": 140,
          "y": 42,
          "z": 280
        },
        "rot": {
          "x": 0,
          "y": -25,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Architecture",
        "layer": "Default",
        "mesh": "SM_HighlandCitadel_Full",
        "mat0": "M_CastleWall_Limestone",
        "mat1": "M_SlateRoof_Blue",
        "anim": "None",
        "physics": false,
        "mass": 50000,
        "collision": "BlockAll"
      },
      {
        "id": "vehicles",
        "name": "Vehicles",
        "type": "sub-folder",
        "color": "#f59e0b",
        "visible": true,
        "pos": {
          "x": 24,
          "y": -3.8,
          "z": 60
        },
        "rot": {
          "x": 0,
          "y": 15,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Vehicle",
        "layer": "Vehicles",
        "mesh": "SK_WoodenSkiff_01",
        "mat0": "M_AgedOak_Planks",
        "mat1": "M_Canvas_Sail",
        "anim": "ABP_BoatBuoyancy",
        "physics": true,
        "mass": 350,
        "collision": "Vehicle"
      },
      {
        "id": "npcs",
        "name": "NPCs",
        "type": "sub-folder",
        "color": "#f59e0b",
        "visible": true,
        "pos": {
          "x": 115,
          "y": 38,
          "z": 240
        },
        "rot": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "AI",
        "layer": "Characters",
        "mesh": "SK_CitadelGuard_Patrol",
        "mat0": "M_PlateArmor_Silver",
        "mat1": "M_RoyalCape",
        "anim": "ABP_GuardPatrol",
        "physics": true,
        "mass": 80,
        "collision": "Character"
      }
    ]
  },
  {
    "id": "lights-group",
    "name": "Lights",
    "type": "folder",
    "expanded": true,
    "children": [
      {
        "id": "dir-light",
        "name": "Directional Light",
        "type": "sub-folder",
        "color": "#eab308",
        "visible": true,
        "pos": {
          "x": 0,
          "y": 500,
          "z": 0
        },
        "rot": {
          "x": 40,
          "y": -30,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Light",
        "layer": "Lighting",
        "mesh": "Light_Sun_Primary",
        "mat0": "None",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      },
      {
        "id": "sky-light",
        "name": "Sky Light",
        "type": "sub-folder",
        "color": "#eab308",
        "visible": true,
        "pos": {
          "x": 0,
          "y": 200,
          "z": 0
        },
        "rot": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Light",
        "layer": "Lighting",
        "mesh": "SkyLight_HDRI_Capture",
        "mat0": "HDRI_AlpineMorning_8K",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      },
      {
        "id": "point-lights",
        "name": "Point Lights",
        "type": "sub-folder",
        "color": "#eab308",
        "visible": true,
        "pos": {
          "x": 135,
          "y": 44,
          "z": 275
        },
        "rot": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "tag": "Light",
        "layer": "Lighting",
        "mesh": "PointLight_CastleTorches",
        "mat0": "None",
        "mat1": "None",
        "anim": "ABP_TorchFlicker",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      }
    ]
  }
];

/* [LINEAGE-AUTHORS]: m4spider */
export const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
