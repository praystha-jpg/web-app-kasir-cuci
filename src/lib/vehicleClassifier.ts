import { type VehicleSize, type CarCategoryPreset } from './utils';

export interface VehicleMatchResult {
  matchedModel: string;
  size: VehicleSize;
  categoryName: string;
  confidence: 'preset' | 'model' | 'fallback';
}

interface ModelEntry {
  names: string[]; // Variations or aliases
  size: VehicleSize;
  categoryName: string;
}

// Comprehensive database of cars in Indonesia
export const POPULAR_CARS: ModelEntry[] = [
  // --- KECIL (City Car, Hatchback, LCGC, Mini EV) ---
  { names: ['brio', 'brio satya', 'brio rs'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['agya', 'toyota agya', 'agya gr'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['ayla', 'daihatsu ayla'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['yaris', 'toyota yaris', 'yaris hev'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['jazz', 'honda jazz', 'fit'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['calya', 'toyota calya'], size: 'Kecil', categoryName: 'City Car / LCGC' },
  { names: ['sigra', 'daihatsu sigra'], size: 'Kecil', categoryName: 'City Car / LCGC' },
  { names: ['ignis', 'suzuki ignis'], size: 'Kecil', categoryName: 'City Car / Compact' },
  { names: ['sirion', 'daihatsu sirion'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['swift', 'suzuki swift'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['baleno', 'baleno hatchback'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['karimun', 'karimun wagon r', 'wagon r'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['air ev', 'wuling air ev', 'airev'], size: 'Kecil', categoryName: 'Mini EV / City Car' },
  { names: ['binguo', 'binguo ev', 'wuling binguo'], size: 'Kecil', categoryName: 'City Car EV' },
  { names: ['cloud ev', 'wuling cloud'], size: 'Kecil', categoryName: 'City Car EV' },
  { names: ['neta v', 'neta'], size: 'Kecil', categoryName: 'City Car EV' },
  { names: ['march', 'nissan march'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['picanto', 'kia picanto', 'morning'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['fiesta', 'ford fiesta'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['mazda 2', 'mazda2'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['mirage', 'mitsubishi mirage'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['s-presso', 'spresso', 'suzuki spresso'], size: 'Kecil', categoryName: 'City Car / Compact' },
  { names: ['datsun go', 'datsun go+', 'datsun cross'], size: 'Kecil', categoryName: 'City Car / LCGC' },
  { names: ['mini cooper', 'mini', 'cooper'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['jimny', 'katana', 'suzuki jimny'], size: 'Kecil', categoryName: 'Compact Offroad' },
  { names: ['splash', 'suzuki splash'], size: 'Kecil', categoryName: 'City Car / Hatchback' },
  { names: ['atoz', 'hyundai atoz', 'visto'], size: 'Kecil', categoryName: 'City Car / Hatchback' },

  // --- SEDANG (MPV, Compact SUV, Sedan, Crossover) ---
  { names: ['avanza', 'toyota avanza', 'all new avanza'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['veloz', 'toyota veloz'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['xenia', 'daihatsu xenia'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['xpander', 'mitsubishi xpander', 'xpander cross'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['ertiga', 'suzuki ertiga', 'all new ertiga'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['xl7', 'suzuki xl7'], size: 'Sedang', categoryName: 'MPV / Crossover' },
  { names: ['mobilio', 'honda mobilio'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['br-v', 'brv', 'honda brv', 'all new br-v'], size: 'Sedang', categoryName: 'Compact SUV / MPV' },
  { names: ['rush', 'toyota rush', 'rush gr'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['terios', 'daihatsu terios'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['hr-v', 'hrv', 'honda hrv'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['wr-v', 'wrv', 'honda wrv'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['creta', 'hyundai creta'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['stargazer', 'hyundai stargazer', 'stargazer x'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['raize', 'toyota raize', 'raize gr'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['rocky', 'daihatsu rocky'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['livina', 'grand livina', 'nissan livina'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['sienta', 'toyota sienta'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['freed', 'honda freed'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['confero', 'wuling confero', 'confero s'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['cortez', 'wuling cortez'], size: 'Sedang', categoryName: 'MPV / Minivan' },
  { names: ['alvez', 'wuling alvez'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['yaris cross', 'yariscross'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['omoda', 'omoda 5', 'omoda e5', 'chery omoda'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['tiggo 7', 'tiggo 5x', 'chery tiggo'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['cx-3', 'cx3', 'cx-30', 'cx30', 'mazda cx3'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['corolla cross', 'corollacross'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['juke', 'nissan juke'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['kicks', 'nissan kicks'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['kona', 'hyundai kona', 'kona ev'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['trax', 'chevrolet trax'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['outlander sport', 'outlander'], size: 'Sedang', categoryName: 'Compact SUV' },
  { names: ['xforce', 'mitsubishi xforce'], size: 'Sedang', categoryName: 'Compact SUV' },

  // Sedans
  { names: ['vios', 'toyota vios', 'all new vios'], size: 'Sedang', categoryName: 'Sedan' },
  { names: ['city', 'honda city', 'city sedan', 'city hatchback'], size: 'Sedang', categoryName: 'Sedan / Hatchback' },
  { names: ['civic', 'honda civic', 'civic turbo', 'civic rs'], size: 'Sedang', categoryName: 'Sedan' },
  { names: ['corolla', 'corolla altis', 'altis'], size: 'Sedang', categoryName: 'Sedan' },
  { names: ['camry', 'toyota camry'], size: 'Sedang', categoryName: 'Sedan' },
  { names: ['accord', 'honda accord'], size: 'Sedang', categoryName: 'Sedan' },
  { names: ['teana', 'nissan teana'], size: 'Sedang', categoryName: 'Sedan' },
  { names: ['mazda 3', 'mazda3', 'mazda 6', 'mazda6'], size: 'Sedang', categoryName: 'Sedan' },
  { names: ['bmw seri 3', 'bmw 320', 'bmw 330', 'seri 3', 'f30', 'g20'], size: 'Sedang', categoryName: 'Sedan Luxury' },
  { names: ['mercedes c-class', 'c-class', 'c200', 'c250', 'c300', 'w205', 'w206'], size: 'Sedang', categoryName: 'Sedan Luxury' },
  { names: ['audi a4', 'audi a3', 'audi a5'], size: 'Sedang', categoryName: 'Sedan Luxury' },
  { names: ['lancer', 'mitsubishi lancer'], size: 'Sedang', categoryName: 'Sedan' },

  // --- BESAR (Big SUV, Big MPV, Luxury, Pickup, Box) ---
  { names: ['innova', 'kijang innova', 'innova reborn', 'innova zenix', 'zenix', 'innova venturer', 'venturer'], size: 'Besar', categoryName: 'Big MPV / Premium' },
  { names: ['fortuner', 'toyota fortuner', 'fortuner vrz', 'fortuner gr'], size: 'Besar', categoryName: 'Big SUV' },
  { names: ['pajero', 'pajero sport', 'mitsubishi pajero', 'pajero dakar'], size: 'Besar', categoryName: 'Big SUV' },
  { names: ['cr-v', 'crv', 'honda crv', 'cr-v turbo', 'all new crv'], size: 'Besar', categoryName: 'Big SUV' },
  { names: ['santa fe', 'hyundai santa fe', 'santafe'], size: 'Besar', categoryName: 'Big SUV' },
  { names: ['palisade', 'hyundai palisade'], size: 'Besar', categoryName: 'Big SUV / Luxury' },
  { names: ['alphard', 'toyota alphard'], size: 'Besar', categoryName: 'Big MPV / Luxury' },
  { names: ['vellfire', 'toyota vellfire'], size: 'Besar', categoryName: 'Big MPV / Luxury' },
  { names: ['carnival', 'kia carnival', 'grand carnival', 'sedona'], size: 'Besar', categoryName: 'Big MPV / Premium' },
  { names: ['voxy', 'toyota voxy'], size: 'Besar', categoryName: 'Big MPV / Premium' },
  { names: ['serena', 'nissan serena'], size: 'Besar', categoryName: 'Big MPV / Premium' },
  { names: ['biante', 'mazda biante'], size: 'Besar', categoryName: 'Big MPV / Premium' },
  { names: ['odyssey', 'honda odyssey'], size: 'Besar', categoryName: 'Big MPV / Premium' },
  { names: ['nav1', 'toyota nav1'], size: 'Besar', categoryName: 'Big MPV / Premium' },
  { names: ['delica', 'mitsubishi delica'], size: 'Besar', categoryName: 'Big MPV / SUV' },
  { names: ['staria', 'hyundai staria'], size: 'Besar', categoryName: 'Big MPV / Premium' },
  { names: ['almaz', 'wuling almaz', 'almaz rs'], size: 'Besar', categoryName: 'Big SUV' },
  { names: ['tiggo 8', 'tiggo 8 pro', 'chery tiggo 8'], size: 'Besar', categoryName: 'Big SUV' },
  { names: ['everest', 'ford everest'], size: 'Besar', categoryName: 'Big SUV' },
  { names: ['terra', 'nissan terra'], size: 'Besar', categoryName: 'Big SUV' },
  { names: ['land cruiser', 'landcruiser', 'prado', 'lc300', 'lc200'], size: 'Besar', categoryName: 'Big SUV / Luxury' },
  { names: ['cx-5', 'cx5', 'cx-8', 'cx8', 'cx-9', 'cx9', 'mazda cx5'], size: 'Besar', categoryName: 'Big SUV' },
  { names: ['ioniq 5', 'ioniq 6', 'hyundai ioniq 5'], size: 'Besar', categoryName: 'Crossover EV' },
  { names: ['ev9', 'kia ev9', 'ev6'], size: 'Besar', categoryName: 'Big SUV EV' },
  { names: ['bmw x3', 'bmw x5', 'bmw x7', 'bmw seri 5', 'bmw seri 7'], size: 'Besar', categoryName: 'Luxury SUV / Sedan' },
  { names: ['mercedes e-class', 's-class', 'gle', 'gls', 'glc'], size: 'Besar', categoryName: 'Luxury SUV / Sedan' },
  { names: ['lexus rx', 'lexus lx', 'lexus lm'], size: 'Besar', categoryName: 'Luxury SUV / MPV' },

  // Commercial / Pickup / Box / Van
  { names: ['gran max', 'granmax', 'daihatsu gran max'], size: 'Besar', categoryName: 'Pickup / Minibus' },
  { names: ['carry', 'new carry', 'suzuki carry', 'futura'], size: 'Besar', categoryName: 'Pickup / Niaga' },
  { names: ['hilux', 'toyota hilux', 'hilux d-cab', 'hilux single cab'], size: 'Besar', categoryName: 'Pickup / D-Cab' },
  { names: ['triton', 'mitsubishi triton', 'strada triton'], size: 'Besar', categoryName: 'Pickup / D-Cab' },
  { names: ['l300', 'mitsubishi l300', 'colt l300', 'elspek'], size: 'Besar', categoryName: 'Pickup / Niaga' },
  { names: ['traga', 'isuzu traga'], size: 'Besar', categoryName: 'Pickup / Niaga' },
  { names: ['d-max', 'dmax', 'isuzu d-max'], size: 'Besar', categoryName: 'Pickup / D-Cab' },
  { names: ['navara', 'nissan navara'], size: 'Besar', categoryName: 'Pickup / D-Cab' },
  { names: ['ranger', 'ford ranger'], size: 'Besar', categoryName: 'Pickup / D-Cab' },
  { names: ['hiace', 'hiace commuter', 'hiace premio', 'toyota hiace'], size: 'Besar', categoryName: 'Minibus / Van' },
  { names: ['elf', 'isuzu elf', 'h-1', 'hyundai h1'], size: 'Besar', categoryName: 'Minibus / Van' },
];

// Comprehensive database of motorcycles in Indonesia
export const POPULAR_MOTORS: ModelEntry[] = [
  // --- KECIL (Matic Kecil, Bebek / Underbone) ---
  { names: ['beat', 'beat street', 'beat deluxe', 'beat pop', 'honda beat'], size: 'Kecil', categoryName: 'Matic Kecil' },
  { names: ['mio', 'mio m3', 'mio s', 'mio z', 'mio sporty', 'mio soul', 'yamaha mio'], size: 'Kecil', categoryName: 'Matic Kecil' },
  { names: ['scoopy', 'honda scoopy', 'all new scoopy'], size: 'Kecil', categoryName: 'Matic Kecil / Retro' },
  { names: ['genio', 'honda genio'], size: 'Kecil', categoryName: 'Matic Kecil' },
  { names: ['spacy', 'honda spacy'], size: 'Kecil', categoryName: 'Matic Kecil' },
  { names: ['fino', 'yamaha fino', 'fino 125'], size: 'Kecil', categoryName: 'Matic Kecil / Retro' },
  { names: ['nex', 'nex ii', 'nex cross', 'suzuki nex'], size: 'Kecil', categoryName: 'Matic Kecil' },
  { names: ['address', 'suzuki address'], size: 'Kecil', categoryName: 'Matic Kecil' },
  { names: ['gear', 'gear 125', 'yamaha gear'], size: 'Kecil', categoryName: 'Matic Kecil' },
  { names: ['revo', 'revo fit', 'revo x', 'honda revo'], size: 'Kecil', categoryName: 'Motor Bebek' },
  { names: ['blade', 'honda blade'], size: 'Kecil', categoryName: 'Motor Bebek' },
  { names: ['supra', 'supra x', 'supra 125', 'supra fit'], size: 'Kecil', categoryName: 'Motor Bebek' },
  { names: ['jupiter', 'jupiter z', 'jupiter z1'], size: 'Kecil', categoryName: 'Motor Bebek' },
  { names: ['vega', 'vega r', 'vega zr', 'vega force'], size: 'Kecil', categoryName: 'Motor Bebek' },
  { names: ['smash', 'suzuki smash', 'shogun'], size: 'Kecil', categoryName: 'Motor Bebek' },
  { names: ['karisma', 'kirana', 'astrea', 'grand', 'legenda'], size: 'Kecil', categoryName: 'Motor Bebek' },

  // --- SEDANG (Matic 125-160cc, Classy Matic) ---
  { names: ['vario', 'vario 125', 'vario 150', 'vario 160', 'vario 110', 'honda vario'], size: 'Sedang', categoryName: 'Matic Sedang' },
  { names: ['fazzio', 'yamaha fazzio', 'fazzio hybrid'], size: 'Sedang', categoryName: 'Matic Classy / Retro' },
  { names: ['filano', 'grand filano', 'yamaha grand filano'], size: 'Sedang', categoryName: 'Matic Classy / Retro' },
  { names: ['lexi', 'lexi 125', 'lexi lx 155', 'yamaha lexi'], size: 'Sedang', categoryName: 'Matic Sedang' },
  { names: ['freego', 'freego 125', 'yamaha freego'], size: 'Sedang', categoryName: 'Matic Sedang' },
  { names: ['burgman street', 'burgman 125', 'suzuki burgman'], size: 'Sedang', categoryName: 'Matic Sedang' },
  { names: ['vespa lx', 'vespa s', 'lx 125', 's 125'], size: 'Sedang', categoryName: 'Vespa Matic' },
  { names: ['supra gtr', 'gtr 150'], size: 'Sedang', categoryName: 'Bebek Sport' },
  { names: ['mx king', 'jupiter mx', 'mx 135', 'mx 150'], size: 'Sedang', categoryName: 'Bebek Sport' },
  { names: ['satria', 'satria fu', 'satria f150', 'suzuki satria'], size: 'Sedang', categoryName: 'Bebek Sport' },
  { names: ['sonic', 'sonic 150', 'honda sonic'], size: 'Sedang', categoryName: 'Bebek Sport' },

  // --- BESAR (Maxi Matic, Sport, Trail, Cruiser, Moge) ---
  { names: ['nmax', 'n-max', 'yamaha nmax', 'all new nmax', 'nmax turbo'], size: 'Besar', categoryName: 'Matic Maxi / Besar' },
  { names: ['pcx', 'pcx 150', 'pcx 160', 'honda pcx'], size: 'Besar', categoryName: 'Matic Maxi / Besar' },
  { names: ['aerox', 'aerox 155', 'yamaha aerox', 'all new aerox'], size: 'Besar', categoryName: 'Matic Maxi / Besar' },
  { names: ['adv', 'adv 150', 'adv 160', 'honda adv'], size: 'Besar', categoryName: 'Matic Maxi / Adventure' },
  { names: ['xmax', 'x-max', 'xmax 250', 'yamaha xmax'], size: 'Besar', categoryName: 'Matic Maxi / 250cc+' },
  { names: ['forza', 'honda forza', 'forza 250'], size: 'Besar', categoryName: 'Matic Maxi / 250cc+' },
  { names: ['tmax', 't-max', 'yamaha tmax'], size: 'Besar', categoryName: 'Maxi Moge' },
  { names: ['cbr', 'cbr150', 'cbr150r', 'cbr250', 'cbr250rr', 'honda cbr'], size: 'Besar', categoryName: 'Motor Sport Fairing' },
  { names: ['ninja', 'ninja 150', 'ninja 250', 'ninja zx', 'zx-25r', 'zx25r', 'zx4r', 'zx6r', 'kawasaki ninja'], size: 'Besar', categoryName: 'Motor Sport Fairing' },
  { names: ['r15', 'r25', 'yamaha r15', 'yamaha r25', 'r15m', 'r7'], size: 'Besar', categoryName: 'Motor Sport Fairing' },
  { names: ['gsx', 'gsx-r150', 'gsx-s150', 'suzuki gsx'], size: 'Besar', categoryName: 'Motor Sport' },
  { names: ['klx', 'klx 150', 'klx 230', 'klx 250', 'd-tracker', 'dtracker', 'kawasaki klx'], size: 'Besar', categoryName: 'Motor Trail / Supermoto' },
  { names: ['crf', 'crf 150', 'crf 150l', 'crf 250', 'crf rally', 'honda crf'], size: 'Besar', categoryName: 'Motor Trail / Dual Sport' },
  { names: ['wr155', 'wr 155', 'wr 155r', 'yamaha wr'], size: 'Besar', categoryName: 'Motor Trail' },
  { names: ['vixion', 'all new vixion', 'vixion r', 'yamaha vixion'], size: 'Besar', categoryName: 'Motor Sport Naked' },
  { names: ['cb150', 'cb150r', 'cb150x', 'verza', 'cb150 verza'], size: 'Besar', categoryName: 'Motor Sport Naked' },
  { names: ['mt-15', 'mt15', 'mt-25', 'mt25', 'yamaha mt'], size: 'Besar', categoryName: 'Motor Sport Naked' },
  { names: ['xsr', 'xsr 155', 'yamaha xsr'], size: 'Besar', categoryName: 'Motor Sport Heritage' },
  { names: ['w175', 'kawasaki w175'], size: 'Besar', categoryName: 'Motor Classic' },
  { names: ['scorpio', 'byson', 'tiger', 'megapro', 'gl pro', 'gl max', 'rx king', 'rx-king'], size: 'Besar', categoryName: 'Motor Sport / Laki' },
  { names: ['vespa sprint', 'sprint 150', 'vespa primavera', 'primavera 150', 'vespa gts', 'gts 150', 'gts 300'], size: 'Besar', categoryName: 'Vespa Maxi / Sport' },
  { names: ['harley', 'harley davidson', 'rebel', 'rebel 500', 'honda rebel', 'vulcan', 'royal enfield', 'benelli', 'ducati', 'bmw gs'], size: 'Besar', categoryName: 'Moge / Cruiser' },
  { names: ['viar', 'tosa', 'roda tiga', 'motor roda 3'], size: 'Besar', categoryName: 'Motor Niaga Roda Tiga' },
];

/**
 * Normalizes string for fuzzy/tolerant comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect vehicle size and recommended category from typed input
 */
export function detectVehicleSize(
  input: string,
  vehicleTypeId: string = 'mobil',
  customPresets: CarCategoryPreset[] = []
): VehicleMatchResult | null {
  const query = normalizeText(input);
  if (!query || query.length < 2) return null;

  // 1. Check custom presets configured in the store (highest priority)
  for (const preset of customPresets) {
    const presetNameNorm = normalizeText(preset.name);
    // Check if query contains preset name or vice versa
    if (query.includes(presetNameNorm) || presetNameNorm.includes(query)) {
      return {
        matchedModel: preset.name,
        size: preset.defaultSize,
        categoryName: preset.name,
        confidence: 'preset',
      };
    }

    // Check examples in preset (e.g. "Avanza, Xenia, Ertiga")
    if (preset.examples) {
      const examples = preset.examples.split(/[,/|]/).map(e => normalizeText(e)).filter(Boolean);
      for (const ex of examples) {
        if (query.includes(ex) || ex.includes(query)) {
          return {
            matchedModel: ex.toUpperCase(),
            size: preset.defaultSize,
            categoryName: preset.name,
            confidence: 'preset',
          };
        }
      }
    }
  }

  // 2. Select dataset according to vehicleTypeId
  const targetDataset: ModelEntry[] = 
    vehicleTypeId === 'motor'
      ? POPULAR_MOTORS
      : vehicleTypeId === 'mobil'
      ? POPULAR_CARS
      : [...POPULAR_CARS, ...POPULAR_MOTORS];

  // Try matching whole words or aliases
  const queryWords = query.split(' ').filter(w => w.length >= 2);

  // Exact / High confidence pass
  for (const entry of targetDataset) {
    for (const name of entry.names) {
      const nameNorm = normalizeText(name);

      // Exact match or includes full name
      if (query === nameNorm) {
        return {
          matchedModel: name.toUpperCase(),
          size: entry.size,
          categoryName: entry.categoryName,
          confidence: 'model',
        };
      }

      // Check if input contains the model name as a distinct word
      const regex = new RegExp(`(^|\\s)${nameNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
      if (regex.test(query)) {
        return {
          matchedModel: name.toUpperCase(),
          size: entry.size,
          categoryName: entry.categoryName,
          confidence: 'model',
        };
      }
    }
  }

  // Substring pass: If the user is halfway typing (e.g. "avanza", "innova", "brio")
  for (const entry of targetDataset) {
    for (const name of entry.names) {
      const nameNorm = normalizeText(name);
      if (nameNorm.length >= 3 && query.includes(nameNorm)) {
        return {
          matchedModel: name.toUpperCase(),
          size: entry.size,
          categoryName: entry.categoryName,
          confidence: 'model',
        };
      }
      // Also match if query is prefix of a distinctive name (length >= 4)
      if (query.length >= 4 && nameNorm.startsWith(query)) {
        return {
          matchedModel: name.toUpperCase(),
          size: entry.size,
          categoryName: entry.categoryName,
          confidence: 'model',
        };
      }
    }
  }

  return null;
}

/**
 * Returns auto-complete suggestion items for typing preview
 */
export function getVehicleSuggestions(
  input: string,
  vehicleTypeId: string = 'mobil',
  customPresets: CarCategoryPreset[] = [],
  maxResults: number = 4
): Array<{ label: string; size: VehicleSize; category: string }> {
  const query = normalizeText(input);
  if (!query || query.length < 2) return [];

  const results: Array<{ label: string; size: VehicleSize; category: string }> = [];
  const seen = new Set<string>();

  const targetDataset = vehicleTypeId === 'motor' ? POPULAR_MOTORS : POPULAR_CARS;

  for (const entry of targetDataset) {
    for (const name of entry.names) {
      const nameNorm = normalizeText(name);
      if (nameNorm.includes(query) || query.includes(nameNorm)) {
        const titleCase = name
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        if (!seen.has(titleCase.toLowerCase())) {
          seen.add(titleCase.toLowerCase());
          results.push({
            label: titleCase,
            size: entry.size,
            category: entry.categoryName,
          });
          if (results.length >= maxResults) return results;
        }
      }
    }
  }

  return results;
}
