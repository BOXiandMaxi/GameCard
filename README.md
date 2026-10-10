<div align="center">

<!-- HERO BANNER -->
<img src="./assets/banner-hero.png" alt="Mythic Card Craft Studio Banner" width="100%" style="border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,0.9); border: 1px solid rgba(255,255,255,0.15);" />

# ⚔️ MYTHIC CARD CRAFT STUDIO ⚔️
### *The Next-Gen 3D Holographic Card Game Engine & Creator*

<p align="center">
  <strong>จักรวาลการ์ดเกมเวทมนตร์ระดับ AAA พร้อมเอฟเฟกต์แสงสะท้อนโฮโลแกรม 3D ฟิสิกส์สมจริง และระบบกระดานรบยุทธวิธี</strong>
</p>

<!-- BADGES SHIELDS -->
[![React](https://img.shields.io/badge/React-18.3%2B-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Audio-Spatial_SFX-E040FB?style=for-the-badge&logo=soundcharts&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](#)

<p align="center">
  <a href="#-visual-showcase--gallery">🖼️ ดูภาพหน้าจอ</a> •
  <a href="#-game-mechanics--combat-system">⚡ ระบบต่อสู้</a> •
  <a href="#-card-rarity--affinity-matrix">💎 ตารางระดับการ์ด</a> •
  <a href="#-quick-start">🚀 ติดตั้งและเริ่มเล่น</a> •
  <a href="#-project-architecture">📁 โครงสร้างไฟล์</a>
</p>

---

</div>

## 📖 สารบัญ (Table of Contents)
1. [ภาพรวมของจักรวาลเกม (Overview & Lore)](#-overview--lore)
2. [แกลเลอรีและระบบอินเทอร์เฟซ (Visual Showcase & Gallery)](#-visual-showcase--gallery)
3. [ฟีเจอร์เด่นระดับโปรเจกต์ใหญ่ (Core Features)](#-core-features)
4. [โครงสร้างการ์ดและระดับความหายาก (Card Anatomy & Rarity)](#-card-rarity--affinity-matrix)
5. [ระบบธาตุและกฎการประลอง (Combat & Affinity System)](#-game-mechanics--combat-system)
6. [ปุ่มควบคุมและคีย์ลัด (Controls & Hotkeys)](#-controls--hotkeys)
7. [การติดตั้งและรันโปรเจกต์ (Quick Start & Installation)](#-quick-start)
8. [โครงสร้างไดเรกทอรี (Project Architecture)](#-project-architecture)
9. [แผนพัฒนาในอนาคต (Roadmap)](#-roadmap)

---

## 🌌 Overview & Lore

ยินดีต้อนรับสู่ **Mythic Card Craft Studio** แพลตฟอร์มการ์ดเกมต่อสู้แนวแฟนตาซี-ไซไฟ ขับเคลื่อนด้วยขุมพลัง **React 18 + TypeScript + Vite** ผู้เล่นจะได้สร้างสรรค์การ์ดนักรบ มังกรเวทมนตร์ และสิ่งประดิษฐ์โบราณ ด้วยระบบ **Studio Customizer** ที่สามารถลากวางอาร์ตเวิร์ก ปรับแต่งค่าสเตตัส และนำการ์ดที่สร้างลงสู่สนามประลอง **Aether Battleground** เพื่อดวลกับศัตรูแบบเรียลไทม์

---

## 📸 Visual Showcase & Gallery

<div align="center">

### ⚡ 0. Live Cinematic Battleground (ตัวอย่างการเล่นจริง)
<img src="./assets/game-battleground.gif" alt="Tactical Battlefield Preview" width="900" style="border-radius: 16px; box-shadow: 0 15px 50px rgba(0,0,0,0.85); border: 2px solid rgba(139, 92, 246, 0.4);" />
<p><em>กระดานสนามรบแบบไดนามิก รองรับการลากการ์ดลงสนาม การคำนวณดาเมจแบบสด และแสงออร่ารอบตัวการ์ด</em></p>

<br/>

### 🎮 อินเทอร์เฟซหลักและระบบเกม 6 มิติ

| 🏰 1. Main Lobby & Game Modes | 🎴 2. 3D Card Hologram Inspector |
| :---: | :---: |
| <img src="./assets/menu-lobby.png" alt="Main Menu" width="430" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.7);" /> | <img src="./assets/card-view.png" alt="Card Inspector" width="430" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.7);" /> |
| **✦ หน้าเมนูหลัก (Lobby & Matchmaking)**<br/>เลือกระหว่างโหมด PvP Ranked, Story Campaign หรือเปิดซองการ์ด | **✦ ตัวตรวจสอบการ์ด 3 มิติ (Card View)**<br/>หมุนการ์ดได้ 360° พร้อมแสงสะท้อน Specular Glare และฟอยล์สายรุ้ง |

| 🧪 3. Card Creator Studio (Drag & Drop) | ⚔️ 4. Combat Phase & Damage Clash |
| :---: | :---: |
| <img src="./assets/studio-creator.png" alt="Card Studio" width="430" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.7);" /> | <img src="./assets/battle-clash.png" alt="Battle Clash" width="430" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.7);" /> |
| **✦ สตูดิโอออกแบบการ์ด (Studio UI)**<br/>อัปโหลดไฟล์รูปภาพ ปรับค่า ATK/DEF และคำนวณ Mana Curve | **✦ จังหวะปะทะและคำนวณพลัง (Combat Phase)**<br/>แอนิเมชันพุ่งโจมตี ตัวเลขคริติคอล และการบล็อกดาเมจ |

| 💥 5. Ultimate Skill & Particle VFX | 🎁 6. Booster Pack Unboxing (Gacha) |
| :---: | :---: |
| <img src="./assets/skill-effect.png" alt="Skill Effects" width="430" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.7);" /> | <img src="./assets/pack-open.png" alt="Booster Pack" width="430" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.7);" /> |
| **✦ เอฟเฟกต์อนุภาคเวทมนตร์ (VFX Blast)**<br/>ลำแสงอัลติเมต ลาวาเพลิง และสนามพลังคริสตัลระเบิด | **✦ ตู้เปิดซองการ์ดลุ้นการ์ดลับ (Pack Opening)**<br/>ฉีกซองพร้อมแสงสว่างวาบตามระดับความหายากของการ์ด |

</div>

---

## ✨ Core Features

### 1. 🪞 3D Holographic Rendering Physics
* **Real-time Gyro / Mouse Tracking:** การ์ดคำนวณพิกัดมุมเอียง $X, Y$ อิงตามเคอร์เซอร์เมาส์แบบ 60 FPS
* **Multi-Layer Blending:** ผสานชั้นเงา, ชั้นฟอยล์สายรุ้ง (`color-dodge`), และเลเยอร์สะท้อนแสงผิวกระจก (`screen`)
* **Haptic Dynamic Bloom:** แสงออร่ารอบตัวการ์ดจะวูบวาบตามพลังชีวิตที่เหลืออยู่

### 2. 🛠️ Complete Card Crafting Suite
* **Drag-and-Drop Uploader:** ลากไฟล์ PNG, JPG, WebP หรือ SVG เข้ามาเป็นภาพการ์ดได้ทันที
* **Client-side Image Processing:** พรีวิวรูปภาพทันใจผ่าน HTML5 FileReader API โดยไม่ต้องเสียเวลารออัปโหลดขึ้นเซิร์ฟเวอร์
* **Auto-Balance Calculation:** มีระบบแจ้งเตือนหากตั้งค่า ATK/DEF สูงเกินสัดส่วน Mana Cost

### 3. ⚔️ Tactical Combat & Damage Engine
* **Turn-Based Sequence:** ระบบเทิร์นสมบูรณ์แบบ (Draw Phase ➔ Mana Surge ➔ Action Phase ➔ Combat Phase ➔ End Turn)
* **Battlefield Mechanics:** การวางการ์ดแนวหน้า (Frontline Defender) และแนวหลัง (Backline Caster)
* **Spell Stack:** ระบบร่ายเวทมนตร์สวนกลับแบบ Instant Trigger

---

## 🃏 Card Rarity & Affinity Matrix

### ระดับความหายาก (Rarity Tiers)

| Rarity | Frame Style | Foil VFX | Drop Rate | Special Trait |
| :---: | :---: | :---: | :---: | :--- |
| **👑 Mythic** | ดำคอสโม + ขอบชมพูนีออน | Cosmic Prism Foil | **1.5%** | ปลดล็อกเสียงพากย์ และภาพการ์ดเคลื่อนไหว (Live2D Effect) |
| **⭐ Legendary** | ทองคำบริสุทธิ์ 24K | Golden Sunburst Glare | **6.0%** | แอนิเมชันเปิดตัวสะเทือนสนามรบ (Board Shaker) |
| **🔮 Epic** | ม่วงอเมทิสต์เวทมนตร์ | Arcane Shimmer | **17.5%** | ขอบการ์ดส่องแสงไอเวทตลอดเวลา |
| **💎 Rare** | ฟ้าคริสตัลไพลิน | Crystalline Reflection | **35.0%** | แสงสะท้อนประกายเพชรเมื่อเอียงการ์ด |
| **🛡️ Common** | เหล็กกล้าโบราณ | Matte Steel Finish | **40.0%** | พื้นผิวเรียบหรู คมชัด สไตล์มินิมอล |

### ระบบความได้เปรียบของธาตุ (Elemental Affinities)

```
        🔥 FLAME (ไฟ)
       ↗           ↘
 🌪️ STORM (ลม)      🌿 NATURE (ธรรมชาติ)
       ↖           ↙
        💧 TIDE (น้ำ)
   (☯️ VOID & CELESTIAL เป็นธาตุขั้วตรงข้ามที่ชนะทางซึ่งกันและกัน)
```

---

## 🎮 Controls & Hotkeys

| การควบคุม (Input) | การทำงาน (Action) |
| :--- | :--- |
| **เมาส์เลื่อนผ่านการ์ด (Hover)** | ควบคุมองศาการเอียง 3 มิติ และมุมตกกระทบของแสง |
| **คลิกค้าง + ลาก (Drag & Drop)** | หยิบการ์ดจากมือไปวางบนสนามรบ หรือลากไฟล์ภาพมาใส่การ์ด |
| **คลิกขวาที่การ์ด (Right Click)** | พลิกดูหลังการ์ด (Inspect Card Back) และอ่าน Lore เรื่องราว |
| **กดปุ่ม `Spacebar`** | ข้ามเฟสปัจจุบัน / จบเทิร์น (End Turn) |
| **กดปุ่ม `F`** | เข้าสู่โหมดตรวจสอบการ์ดแบบเต็มหน้าจอ (Fullscreen Inspect) |

---

## 🚀 Quick Start

### 📋 สิ่งที่ต้องเตรียม (Prerequisites)
* [Node.js](https://nodejs.org/) (เวอร์ชัน 18.0 ขึ้นไป)
* ตัวจัดการแพ็กเกจ `npm`, `pnpm` หรือ `yarn`

### 1. โคลนโปรเจกต์ (Clone Repository)
```bash
git clone [https://github.com/your-username/mythic-card-studio.git](https://github.com/your-username/mythic-card-studio.git)
cd mythic-card-studio
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. รันเซิร์ฟเวอร์สำหรับพัฒนา (Development Mode)
```bash
npm run dev
```
เปิดเบราว์เซอร์แล้วไปที่ `http://localhost:5173/` เพื่อเริ่มทดสอบทันที!

### 4. คอมไพล์สำหรับ Production (Build Project)
```bash
npm run build
```

---

## 📁 Project Architecture

```text
mythic-card-studio/
├── 📁 assets/                     # ภาพประกอบเอกสารและแบนเนอร์แสดงผล
│   ├── banner-hero.png
│   ├── game-battleground.gif
│   ├── menu-lobby.png
│   ├── card-view.png
│   ├── studio-creator.png
│   ├── battle-clash.png
│   ├── skill-effect.png
│   └── pack-open.png
├── 📁 public/                     # ไฟล์สาธารณะ (เสียง SFX, โมเดล, แฟวิคอน)
│   ├── sfx/
│   │   ├── card-flip.mp3
│   │   └── attack-impact.mp3
│   └── textures/
├── 📁 src/
│   ├── 📁 components/             # คอมโพเนนต์ย่อยของระบบ
│   │   ├── 📁 3d-card/            # ระบบการ์ด 3D, ฟอยล์ และเงาสะท้อน
│   │   ├── 📁 battlefield/        # กระดานต่อสู้ ช่องวางการ์ด และเลนโจมตี
│   │   ├── 📁 studio/             # แผงเครื่องมือปรับแต่งและระบบอัปโหลดไฟล์
│   │   └── 📁 vfx/                # ระบบอนุภาค เวทมนตร์ และดาเมจลอย
│   ├── 📁 hooks/                  # Custom Hooks (เมาส์ 3D, ตรวจสอบไฟล์)
│   ├── 📁 types/                  # TypeScript Interfaces และ Enum ชนิดการ์ด
│   ├── 📁 utils/                  # ฟังก์ชันคำนวณดาเมจ และแปลงรูปภาพ
│   ├── App.tsx                    # หน้าควบคุมหลัก (State Management)
│   ├── App.css                    # สไตล์ชีตเอฟเฟกต์โฮโลแกรมและแอนิเมชัน
│   └── main.tsx                   # จุดเริ่มต้นโปรเจกต์ React
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🗺️ Roadmap

- [x] **Phase 1: Foundation (สำเร็จแล้ว)**
  - [x] ระบบจำลองการ์ด 3D Tilt ด้วย CSS Transform Matrix
  - [x] เอฟเฟกต์โฮโลแกรมและฟอยล์สายรุ้ง (Holo-sheen shader)
  - [x] ระบบลากวางไฟล์รูปภาพแบบ Drag & Drop พร้อมพรีวิวทันที
- [ ] **Phase 2: Combat & Sound Engine (กำลังพัฒนา)**
  - [ ] ระบบกระดานต่อสู้พร้อม AI Bot สำหรับฝึกซ้อม
  - [ ] เสียงพากย์และการใส่ระบบเสียง Spatial 3D Audio (Web Audio API)
  - [ ] ส่งออกการ์ดความละเอียดสูงเป็นไฟล์รูปภาพ PNG / WebP ด้วย `html2canvas`
- [ ] **Phase 3: Multiplayer Expansion**
  - [ ] ระบบห้องดวลการ์ดแบบออนไลน์ Real-time ผ่าน WebSockets
  - [ ] บันทึกเด็คการ์ดลง LocalStorage และคลาวด์

---

## 📜 License

โปรเจกต์นี้เผยแพร่ภายใต้ใบอนุญาต **MIT License** — สามารถนำไปศึกษา ดัดแปลง หรือต่อยอดพัฒนาเกมของตนเองได้อย่างอิสระ ดูรายละเอียดเพิ่มเติมได้ที่ไฟล์ [LICENSE](LICENSE)

<div align="center">

---

**Crafted with ⚔️ by the Mythic Card Guild**  
*Star ⭐ คลังนี้บน GitHub หากคุณชื่นชอบเอฟเฟกต์และงานออกแบบนี้!*

</div>
