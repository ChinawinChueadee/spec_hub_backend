import { randomUUID } from "crypto";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";
import { uploadToR2 } from "../src/services/r2.storage.service.js";

/*
 * Creates ACTIVE mock Listings for every Category created by prisma/mock.js.
 * Run prisma/mock.js first. Re-running replaces the previous mock Listings.
 *
 *   node prisma/mock-listings.js             upload product images to R2
 *   node prisma/mock-listings.js --no-images create Listings without images
 *   node prisma/mock-listings.js --only=CPU,Mainboard,Case
 *                                            only replace these Categories
 *
 * Image source, in order:
 *   1. prisma/mock-images/<slug>.(jpg|jpeg|png|webp)  your own photo
 *      slug = title in lowercase with "-", e.g. nvidia-rtx-4070-super.jpg
 *   2. Wikimedia Commons photo (free license, credited in the description)
 *   3. Placeholder image with the product name
 */

const MOCK_SELLER_EMAIL = "mock.seller@spechub.test";
const MOCK_SELLER_PASSWORD = "MockSeller123!";

const MOCK_IMAGES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "mock-images",
);

const USER_AGENT = "SpecHubMockSeeder/1.0 (local dev seed script; low volume)";

const withImages = !process.argv.includes("--no-images");

const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyNames = onlyArg
  ? onlyArg
      .slice("--only=".length)
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  : null;

const LOCATIONS = ["Bangkok", "Nonthaburi", "Chiang Mai", "Khon Kaen", "Phuket"];

const mockListings = {
  Keyboard: [
    {
      brand: "Keychron",
      model: "K8",
      price: 2490,
      condition: "LIKE_NEW",
      commonsFile: "Keychron K8 Non-Backlight Wireless Mechanical Keyboard - 52772428371.jpg",
    },
    {
      brand: "Razer",
      model: "BlackWidow Chroma",
      price: 1990,
      condition: "GOOD",
      commonsFile: "Razer Blackwidow Chroma 1 2017-01-01.jpg",
    },
    {
      brand: "Razer",
      model: "BlackWidow Ultimate 2014",
      price: 1290,
      condition: "FAIR",
      commonsFile: "Razer BlackWidow Ultimate 2014 Elite Mechanical Gaming Keyboard.jpg",
    },
    {
      brand: "Logitech",
      model: "K780 Multi-Device",
      price: 1590,
      condition: "LIKE_NEW",
      commonsFile: "Logitech K780 CJK Keyboard.jpg",
    },
    {
      brand: "Logitech",
      model: "K380",
      price: 790,
      condition: "GOOD",
      commonsFile: "Logitech K380 CJK Keyboard.jpg",
    },
    {
      brand: "Logitech",
      model: "MK240 Nano",
      price: 390,
      condition: "FAIR",
      commonsFile: "Logitech MK240 CJK Keyboard.jpg",
    },
  ],
  Mouse: [
    {
      brand: "Logitech",
      model: "G502",
      price: 1190,
      condition: "GOOD",
      commonsFile: "Logitech-g502 (13971829039).jpg",
    },
    {
      brand: "Razer",
      model: "DeathAdder Elite",
      price: 990,
      condition: "LIKE_NEW",
      commonsFile: "Razer DeathAdder Elite-front oblique-ar 16to10-fs PNr°0465.jpg",
    },
    {
      brand: "Razer",
      model: "DeathAdder 2013",
      price: 590,
      condition: "FAIR",
      commonsFile: "Razer DeathAdder 2013 Edition-front oblique-ar 16to10-fs PNr°0400.jpg",
    },
    {
      brand: "Logitech",
      model: "MX Master 3S",
      price: 2790,
      condition: "LIKE_NEW",
      commonsFile: "Logitech MX Master 3S HS11.jpg",
    },
    {
      brand: "Logitech",
      model: "MX Master",
      price: 1290,
      condition: "FAIR",
      commonsFile: "2017 Mysz komputerowa Logitech MX Master.jpg",
    },
    {
      brand: "SteelSeries",
      model: "Rival 310",
      price: 890,
      condition: "GOOD",
      commonsFile: "Rival Mouse by SteelSeries, FACEIT (2018, Cropped).jpg",
    },
  ],
  Monitor: [
    {
      brand: "ASUS",
      model: "ROG Strix XG32VQR",
      price: 8900,
      condition: "GOOD",
      commonsFile: "ASUS ROG Strix XG32VQR monitor.jpg",
    },
    {
      brand: "ASUS",
      model: "PB278Q 27\"",
      price: 4500,
      condition: "GOOD",
      commonsFile: "ASUS PB278Q (PXL 20250914 223256075).jpg",
    },
    {
      brand: "ASUS",
      model: "ProArt PA246Q",
      price: 3900,
      condition: "FAIR",
      commonsFile: "Asus ProArt PA246Q monitor 3.JPG",
    },
    {
      brand: "Dell",
      model: "Professional P2212H",
      price: 1990,
      condition: "GOOD",
      commonsFile: "Dell Professional P2212H-9900.jpg",
    },
    {
      brand: "BenQ",
      model: "FP93GX 19\"",
      price: 990,
      condition: "FAIR",
      commonsFile: "BenQ FP93GX-9246.jpg",
    },
    {
      brand: "LG",
      model: "L194WT-SF",
      price: 790,
      condition: "POOR",
      commonsFile: "LG L194WT-SF LCD monitor.jpg",
    },
  ],
  Headphone: [
    {
      brand: "Sennheiser",
      model: "HD 800 S",
      price: 32900,
      condition: "LIKE_NEW",
      commonsFile: "Sennheiser HD800S.jpg",
    },
    {
      brand: "Sennheiser",
      model: "HD 25",
      price: 3990,
      condition: "GOOD",
      commonsFile: "Sennheiser hd-25 headphones.jpg",
    },
    {
      brand: "Sennheiser",
      model: "HD 540 Reference (Vintage)",
      price: 2490,
      condition: "FAIR",
      commonsFile: "2023 Słuchawki Sennheiser HD 540.jpg",
    },
    {
      brand: "Audio-Technica",
      model: "ATH-M70x",
      price: 6490,
      condition: "LIKE_NEW",
      commonsFile: "Audio-Technica ATH-M70x Headphones folded.jpg",
    },
    {
      brand: "Logitech",
      model: "G35",
      price: 1290,
      condition: "FAIR",
      commonsFile: "Logitech G35 side view.jpg",
    },
    {
      brand: "Sony",
      model: "WI-XB400",
      price: 990,
      condition: "GOOD",
      commonsFile: "2023 Słuchawki Sony WI-XB400 (1).jpg",
    },
  ],
  Laptop: [
    {
      brand: "Apple",
      model: "MacBook Air M1",
      price: 17900,
      condition: "GOOD",
      commonsFile: "MacBook Air M1.png",
    },
    {
      brand: "ASUS",
      model: "ROG Zephyrus G14",
      price: 32900,
      condition: "LIKE_NEW",
      commonsFile: "ASUS ROG Zephyrus 2026-08-15 G14.jpg",
    },
    {
      brand: "Lenovo",
      model: "ThinkPad T14 Gen 2",
      price: 12900,
      condition: "FAIR",
      commonsFile: "Lenovo ThinkPad T14 Gen 2 AMD.jpg",
    },
    {
      brand: "Apple",
      model: "MacBook Pro 16 M1 Pro",
      price: 42900,
      condition: "LIKE_NEW",
      commonsFile: "MacBook Pro 16 (M1 Pro, 2021) - Wikipedia.jpg",
    },
    {
      brand: "HP",
      model: "Laptop 15-da1xxx",
      price: 8900,
      condition: "GOOD",
      commonsFile: "HP Laptop 15-da1xxx.jpg",
    },
    {
      brand: "Acer",
      model: "Aspire 5 A515-51",
      price: 6900,
      condition: "FAIR",
      commonsFile: "Acer Aspire A515-51.jpg",
    },
  ],
  Storage: [
    {
      brand: "Samsung",
      model: "970 EVO Plus 250GB",
      price: 990,
      condition: "LIKE_NEW",
      commonsFile: "2023 Napęd Samsung 970 EVO Plus 250GB (1).jpg",
    },
    {
      brand: "Kingston",
      model: "NV2 2TB",
      price: 3290,
      condition: "LIKE_NEW",
      commonsFile: "2023 Dysk SSD Kingston NV2 2TB.jpg",
    },
    {
      brand: "Crucial",
      model: "MX300 525GB",
      price: 990,
      condition: "GOOD",
      commonsFile: "Crucial SSD MX300 525GB-8479.jpg",
    },
    {
      brand: "Kingston",
      model: "A400 120GB",
      price: 390,
      condition: "FAIR",
      commonsFile: "SA400S37120G.jpg",
    },
    {
      brand: "Seagate",
      model: "Expansion Portable 1TB",
      price: 1290,
      condition: "GOOD",
      commonsFile: "Seagate SRD0NF1 portable hard drive HS1.jpg",
    },
    {
      brand: "WD",
      model: "My Book Studio 2TB",
      price: 1490,
      condition: "FAIR",
      commonsFile: "Western Digital My Book Studio-9736.jpg",
    },
  ],
  RAM: [
    {
      brand: "Corsair",
      model: "Vengeance RGB DDR4 16GB",
      price: 1690,
      condition: "LIKE_NEW",
      commonsFile: "2023 Pamięci Corsair Vengeance RGB.jpg",
    },
    {
      brand: "Corsair",
      model: "Vengeance DDR3 16GB",
      price: 590,
      condition: "FAIR",
      commonsFile: "Corsair Vengeance 16GB (8354711166).jpg",
    },
    {
      brand: "Kingston",
      model: "FURY Impact DDR5 SO-DIMM 32GB",
      price: 3490,
      condition: "LIKE_NEW",
      commonsFile: "Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - front view.jpg",
    },
    {
      brand: "G.Skill",
      model: "RipjawsX DDR3 2x4GB",
      price: 490,
      condition: "GOOD",
      commonsFile: "G.Skill RipjawsX DDR3 memory modules.JPG",
    },
    {
      brand: "Corsair",
      model: "DDR4 2x8GB",
      price: 1190,
      condition: "GOOD",
      commonsFile: "2*8Go DDR4 Corsair - 2018-05-08.jpg",
    },
    {
      brand: "Kingston",
      model: "HyperX DDR2 2x2GB (Vintage)",
      price: 290,
      condition: "FAIR",
      commonsFile: "Kingston KHX6400S2ULK2-4G 2pcs 20120419.jpg",
    },
  ],
  "Graphics Card": [
    {
      brand: "Gigabyte",
      model: "RTX 4070 Aero OC 12GB",
      price: 18900,
      condition: "LIKE_NEW",
      commonsFile: "2023 Gigabyte GeForce RTX 4070 Aero OC 12GB (2).jpg",
    },
    {
      brand: "Palit",
      model: "RTX 5090 GameRock",
      price: 89900,
      condition: "LIKE_NEW",
      commonsFile: "Palit GeForce RTX 5090 Gamerock 20250530 HOF4166 RAW-Export.png",
    },
    {
      brand: "MSI",
      model: "RTX 2080 Gaming X Trio",
      price: 7900,
      condition: "GOOD",
      commonsFile: "2023 MSI GeForce RTX 2080 Gaming X Trio (5).jpg",
    },
    {
      brand: "ATI",
      model: "Radeon HD 5970 (Vintage)",
      price: 1490,
      condition: "FAIR",
      commonsFile: "ATI Radeon HD 5970 Graphics Card-oblique view.jpg",
    },
    {
      brand: "ATI",
      model: "Radeon HD 5850 (Vintage)",
      price: 790,
      condition: "FAIR",
      commonsFile: "ATI Radeon HD 5850 Graphics Card-oblique view.jpg",
    },
    {
      brand: "HIS",
      model: "Radeon X1950 XTX (Vintage)",
      price: 590,
      condition: "POOR",
      commonsFile: "HIS ATI Radeon X1950XTX 512Mb GDDR4 Graphics Card.jpg",
    },
  ],
  CPU: [
    {
      brand: "AMD",
      model: "Ryzen 5 5600X",
      price: 3990,
      condition: "LIKE_NEW",
      commonsFile: "AMD Ryzen 5 5600X.jpg",
    },
    {
      brand: "AMD",
      model: "Ryzen 7 1800X",
      price: 2290,
      condition: "GOOD",
      commonsFile: "AMD Ryzen 7 1800X.jpg",
    },
    {
      brand: "Intel",
      model: "Core i7-4790K",
      price: 1990,
      condition: "FAIR",
      commonsFile: "4th Generation Intel® Core™ i7 Processor Unlocked Box.jpg",
    },
    {
      brand: "Intel",
      model: "Core i9-14900KF",
      price: 15900,
      condition: "LIKE_NEW",
      commonsFile: "Intel i9-14900KF CPU.jpg",
    },
    {
      brand: "AMD",
      model: "Ryzen 9 7900X",
      price: 11900,
      condition: "GOOD",
      commonsFile: "AMD Ryzen 9 7900X.jpg",
    },
    {
      brand: "Intel",
      model: "Core i9-9900K",
      price: 5900,
      condition: "GOOD",
      commonsFile: "Intel i9-9900K.jpg",
    },
  ],
  Mainboard: [
    {
      brand: "ASUS",
      model: "ROG Strix Z690-A Gaming WiFi",
      price: 7900,
      condition: "LIKE_NEW",
      commonsFile: "2023 Płyta główna Asus ROG STRIX Z690-A GAMING WIFI.jpg",
    },
    {
      brand: "ASUS",
      model: "ROG Strix Z390-F Gaming",
      price: 3990,
      condition: "GOOD",
      commonsFile: "Asus-ROG-Strix-Z390-F-Gaming-Motherboard 20201120 DSC6025.jpg",
    },
    {
      brand: "ASUS",
      model: "Prime A320M-K",
      price: 1290,
      condition: "FAIR",
      commonsFile: "I Paired AMD Ryzen 7 5700x With Asus Prime A 320M-K Motherboard.jpg",
    },
    {
      brand: "ASRock",
      model: "TRX50 WS",
      price: 24900,
      condition: "LIKE_NEW",
      commonsFile: "ASRock TRX50 WS 20240406 HOF1812-HDR RAW-Export 000182.png",
    },
    {
      brand: "ASRock",
      model: "A320M-DVS",
      price: 990,
      condition: "GOOD",
      commonsFile: "2023 Płyta główna ASRock A320M-DVS.jpg",
    },
    {
      brand: "MSI",
      model: "K7T266 Pro (Vintage)",
      price: 490,
      condition: "POOR",
      commonsFile: "MSI K7T266 motherboard.jpg",
    },
  ],
  Case: [
    {
      brand: "Lian Li",
      model: "O11 Dynamic EVO XL",
      price: 5900,
      condition: "LIKE_NEW",
      commonsFile: "Lian Li O11 Dynamic Evo XL (der8auer edition) HOF1974-HDR RAW-Export 000210 CENS.png",
    },
    {
      brand: "Generic",
      model: "ATX Mid Tower",
      price: 890,
      condition: "FAIR",
      commonsFile: "ATX computer case - left - 2018-05-18.jpg",
    },
    {
      brand: "NZXT",
      model: "H500i",
      price: 1890,
      condition: "GOOD",
      commonsFile: "NZXT H500i case empty 10-13-2018.jpg",
    },
    {
      brand: "Cooler Master",
      model: "HAF 932",
      price: 1490,
      condition: "FAIR",
      commonsFile: "Cooler Master HAF 932.jpg",
    },
    {
      brand: "Cooler Master",
      model: "Stacker 832",
      price: 990,
      condition: "FAIR",
      commonsFile: "Cooler Master Stacker 832 20101230.jpg",
    },
    {
      brand: "Cooler Master",
      model: "MasterBox E501L",
      price: 1290,
      condition: "GOOD",
      commonsFile: "Cooler Master E501L K501L 20190601.jpg",
    },
  ],
};

const CONDITION_SCORES = {
  LIKE_NEW: 95,
  GOOD: 82,
  FAIR: 68,
  POOR: 45,
};

const CONDITION_TEXT = {
  LIKE_NEW: "Like new, barely used, all original accessories included.",
  GOOD: "Used with care, minor signs of wear, fully working.",
  FAIR: "Visible signs of use but tested and working properly.",
  POOR: "Heavy wear, works but has some issues.",
};

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const toSlug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const getMockAnswer = (question) => {
  switch (question.answerType) {
    case "BOOLEAN":
      return true;
    case "NUMBER":
      return 100;
    case "SELECT":
      return Array.isArray(question.options) ? question.options[0] : "";
    default:
      return "Works as expected.";
  }
};

const ensureMockSeller = async () => {
  const passwordHash = await bcrypt.hash(MOCK_SELLER_PASSWORD, 12);

  return await prisma.user.upsert({
    where: { email: MOCK_SELLER_EMAIL },
    update: {},
    create: {
      email: MOCK_SELLER_EMAIL,
      passwordHash,
      firstName: "Mock",
      lastName: "Seller",
      isVerified: true,
    },
  });
};

const listLocalImages = async () => {
  try {
    return await readdir(MOCK_IMAGES_DIR);
  } catch {
    return [];
  }
};

/*
 * Looks up Commons files in a few batched requests
 * to stay well under the Wikimedia rate limit.
 * The API accepts at most 50 titles per request.
 */
const COMMONS_BATCH_SIZE = 25;

const fetchCommonsImageInfo = async (fileNames) => {
  const result = new Map();

  for (let i = 0; i < fileNames.length; i += COMMONS_BATCH_SIZE) {
    const batch = await fetchCommonsImageInfoBatch(
      fileNames.slice(i, i + COMMONS_BATCH_SIZE),
    );

    for (const [name, info] of batch) {
      result.set(name, info);
    }
  }

  return result;
};

const fetchCommonsImageInfoBatch = async (fileNames) => {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    titles: fileNames.map((name) => `File:${name}`).join("|"),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1000",
  });

  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    { headers: { "User-Agent": USER_AGENT } },
  );

  if (!response.ok) {
    throw new Error(`Wikimedia lookup failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Wikimedia lookup failed: ${data.error.info}`);
  }

  /*
   * The API normalizes titles (e.g. "_" to " "),
   * so map results back to the requested names.
   */
  const normalized = new Map(
    (data.query?.normalized ?? []).map((item) => [item.to, item.from]),
  );

  const result = new Map();

  for (const page of Object.values(data.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];

    if (!info) {
      continue;
    }

    const requestedTitle = normalized.get(page.title) ?? page.title;
    const metadata = info.extmetadata ?? {};

    result.set(requestedTitle.replace(/^File:/, ""), {
      url: info.thumburl ?? info.url,
      license: metadata.LicenseShortName?.value ?? "see Wikimedia Commons",
      artist:
        (metadata.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim() ||
        "Unknown author",
    });
  }

  return result;
};

const downloadImage = async (url) => {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0];
  const ext = Object.keys(CONTENT_TYPES).find(
    (key) => CONTENT_TYPES[key] === contentType,
  );

  if (!ext) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    ext,
    contentType,
  };
};

/*
 * Returns the image to upload and an optional credit line.
 */
const resolveImage = async (item, title, localImages, commonsInfo) => {
  const slug = toSlug(title);
  const localFile = localImages.find(
    (file) => path.parse(file).name.toLowerCase() === slug,
  );

  if (localFile) {
    const ext = path.extname(localFile).slice(1).toLowerCase();

    if (CONTENT_TYPES[ext]) {
      return {
        buffer: await readFile(path.join(MOCK_IMAGES_DIR, localFile)),
        ext,
        contentType: CONTENT_TYPES[ext],
        credit: null,
      };
    }
  }

  const commons = item.commonsFile && commonsInfo.get(item.commonsFile);

  if (commons) {
    return {
      ...(await downloadImage(commons.url)),
      credit:
        `Photo: "${item.commonsFile}" by ${commons.artist}, ` +
        `${commons.license}, via Wikimedia Commons.`,
    };
  }

  const text = encodeURIComponent(title).replace(/%20/g, "+");

  return {
    ...(await downloadImage(
      `https://placehold.co/800x600/1f1f1f/f97316/png?text=${text}`,
    )),
    credit: null,
  };
};

const main = async () => {
  const categories = await prisma.category.findMany({
    where: onlyNames ? { name: { in: onlyNames } } : undefined,
    include: {
      conditionQuestions: { where: { isActive: true } },
    },
  });

  if (categories.length === 0) {
    throw new Error("No Categories found. Run `node prisma/mock.js` first.");
  }

  const missingNames = (onlyNames ?? []).filter(
    (name) => !categories.some((category) => category.name === name),
  );

  if (missingNames.length > 0) {
    throw new Error(
      `Categories not found: ${missingNames.join(", ")}. ` +
        `Run \`node prisma/mock.js --only=${missingNames.join(",")}\` first.`,
    );
  }

  const seller = await ensureMockSeller();

  /*
   * Listings that already have Orders are kept
   * so existing Orders are not broken.
   */
  const removed = await prisma.listing.deleteMany({
    where: {
      sellerId: seller.id,
      categoryId: { in: categories.map((category) => category.id) },
      orders: { none: {} },
    },
  });

  console.log(`Removed ${removed.count} previous mock Listings.`);

  const localImages = withImages ? await listLocalImages() : [];
  let commonsInfo = new Map();

  if (withImages) {
    const commonsFiles = categories
      .flatMap((category) => mockListings[category.name] ?? [])
      .map((item) => item.commonsFile)
      .filter(Boolean);

    try {
      commonsInfo = await fetchCommonsImageInfo(commonsFiles);
    } catch (error) {
      console.warn(`${error.message}. Using placeholder images instead.`);
    }
  }

  let created = 0;

  for (const category of categories) {
    const items = mockListings[category.name] ?? [];

    for (const item of items) {
      const title = `${item.brand} ${item.model}`;

      let image = null;

      if (withImages) {
        try {
          image = await resolveImage(item, title, localImages, commonsInfo);
        } catch (error) {
          console.warn(`No image for "${title}": ${error.message}`);
        }
      }

      const description = [
        `${title} for sale. ${CONDITION_TEXT[item.condition]}`,
        image?.credit,
      ]
        .filter(Boolean)
        .join("\n\n");

      const listing = await prisma.listing.create({
        data: {
          sellerId: seller.id,
          categoryId: category.id,
          title,
          description,
          brand: item.brand,
          model: item.model,
          price: item.price,
          estimatedCondition: item.condition,
          estimatedScore: CONDITION_SCORES[item.condition],
          location: LOCATIONS[created % LOCATIONS.length],
          status: "ACTIVE",

          conditionAnswers: {
            create: category.conditionQuestions.map((question) => ({
              questionId: question.id,
              answerValue: getMockAnswer(question),
            })),
          },
        },
      });

      if (image) {
        try {
          const key = `listings/${listing.id}/${randomUUID()}.${image.ext}`;

          await uploadToR2({
            buffer: image.buffer,
            key,
            contentType: image.contentType,
          });

          await prisma.listingImage.create({
            data: {
              listingId: listing.id,
              imageKey: key,
              sortOrder: 0,
              isCover: true,
            },
          });
        } catch (error) {
          console.warn(`Image upload failed for "${title}": ${error.message}`);
        }
      }

      created += 1;
      console.log(
        `Created ${category.name}: ${title}` +
          (image ? (image.credit ? " (Commons photo)" : " (image)") : ""),
      );
    }
  }

  console.log(`Mock Listings completed: ${created} created.`);
  console.log(`Mock seller login: ${MOCK_SELLER_EMAIL} / ${MOCK_SELLER_PASSWORD}`);
};

main()
  .catch((error) => {
    console.error("Mock Listings failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
