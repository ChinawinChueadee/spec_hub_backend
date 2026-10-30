// import bcrypt from "bcryptjs";
// // import { prisma } from "../src/lib/prisma.js";
// import { prisma } from "../src/lib/prisma.js";
// async function main() {
//   const adminEmail = process.env.ADMIN_EMAIL;
//   const adminPassword = process.env.ADMIN_PASSWORD;

//   if (!adminEmail || !adminPassword) {
//     throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
//   }

//   const existingAdmin = await prisma.user.findUnique({
//     where: {
//       email: adminEmail,
//     },
//   });

//   if (existingAdmin) {
//     console.log("Admin already exists");
//     return;
//   }

//   const hashedPassword = await bcrypt.hash(adminPassword, 12);

//   await prisma.user.create({
//     data: {
//       email: adminEmail,
//       passwordHash: hashedPassword,
//       firstName: "System",
//       lastName: "Admin",
//       role: "ADMIN",
//     },
//   });

//   console.log("Admin created successfully");
// }

// main()
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

import { prisma } from "../src/lib/prisma.js";

const mockCategories = [
  {
    name: "Keyboard",
    questions: [
      {
        label: "Does the keyboard power on and connect properly?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Are all keys working properly?",
        answerType: "SELECT",
        options: ["All working", "Some keys not working", "Not tested"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Is there any visible physical damage?",
        answerType: "SELECT",
        options: ["No damage", "Minor scratches", "Major damage"],
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "How long has the keyboard been used?",
        answerType: "NUMBER",
        options: null,
        isRequired: false,
        sortOrder: 4,
      },
    ],
  },

  {
    name: "Mouse",
    questions: [
      {
        label: "Does the mouse connect and work properly?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Are all mouse buttons working?",
        answerType: "SELECT",
        options: ["All working", "Some buttons not working", "Not tested"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Does the scroll wheel work normally?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "What is the physical condition?",
        answerType: "SELECT",
        options: ["Very clean", "Minor wear", "Heavy wear"],
        isRequired: true,
        sortOrder: 4,
      },
    ],
  },

  {
    name: "Monitor",
    questions: [
      {
        label: "Does the monitor power on normally?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Are there any dead or stuck pixels?",
        answerType: "SELECT",
        options: ["None", "A few", "Many", "Not tested"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Are there visible scratches or screen damage?",
        answerType: "SELECT",
        options: ["None", "Minor scratches", "Major damage"],
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "Are the display ports working properly?",
        answerType: "SELECT",
        options: ["All working", "Some not working", "Not tested"],
        isRequired: true,
        sortOrder: 4,
      },
    ],
  },

  {
    name: "Headphone",
    questions: [
      {
        label: "Does audio play correctly on both sides?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Does the microphone work properly?",
        answerType: "SELECT",
        options: ["Working", "Not working", "No microphone", "Not tested"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "What is the condition of the ear cushions?",
        answerType: "SELECT",
        options: ["Very good", "Minor wear", "Heavily worn"],
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "Is there any physical damage?",
        answerType: "SELECT",
        options: ["No damage", "Minor damage", "Major damage"],
        isRequired: true,
        sortOrder: 4,
      },
    ],
  },

  {
    name: "Laptop",
    questions: [
      {
        label: "Does the laptop power on normally?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "What is the battery condition?",
        answerType: "SELECT",
        options: ["Good", "Average", "Poor", "Battery not working"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Are the keyboard and touchpad working properly?",
        answerType: "SELECT",
        options: ["All working", "Some issues", "Not tested"],
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "Is there any screen damage?",
        answerType: "SELECT",
        options: ["No damage", "Minor scratches", "Major damage"],
        isRequired: true,
        sortOrder: 4,
      },
      {
        label: "Are all major ports working?",
        answerType: "SELECT",
        options: ["All working", "Some not working", "Not tested"],
        isRequired: true,
        sortOrder: 5,
      },
    ],
  },

  {
    name: "Storage",
    questions: [
      {
        label: "Is the storage device detected by a computer?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Does the device read and write data normally?",
        answerType: "SELECT",
        options: ["Working normally", "Has issues", "Not tested"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Is there any physical damage?",
        answerType: "SELECT",
        options: ["No damage", "Minor damage", "Major damage"],
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "How long has the device been used?",
        answerType: "NUMBER",
        options: null,
        isRequired: false,
        sortOrder: 4,
      },
    ],
  },

  {
    name: "RAM",
    questions: [
      {
        label: "Is the RAM detected correctly by the system?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Has the RAM passed a memory test?",
        answerType: "SELECT",
        options: ["Passed", "Failed", "Not tested"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Is there any visible physical damage?",
        answerType: "SELECT",
        options: ["No damage", "Minor damage", "Major damage"],
        isRequired: true,
        sortOrder: 3,
      },
    ],
  },

  {
    name: "Graphics Card",
    questions: [
      {
        label: "Does the graphics card output display normally?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Has the graphics card been tested under load?",
        answerType: "SELECT",
        options: ["Tested and stable", "Has issues", "Not tested"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Do the cooling fans work properly?",
        answerType: "SELECT",
        options: ["All working", "Some issues", "Not working"],
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "Is there visible physical damage?",
        answerType: "SELECT",
        options: ["No damage", "Minor damage", "Major damage"],
        isRequired: true,
        sortOrder: 4,
      },
    ],
  },

  {
    name: "CPU",
    questions: [
      {
        label: "Does the CPU boot and run normally?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Has the CPU been stress tested?",
        answerType: "SELECT",
        options: ["Tested and stable", "Has issues", "Not tested"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Are the pins or contact pads in good condition?",
        answerType: "SELECT",
        options: ["No damage", "Minor damage", "Major damage"],
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "Has the CPU been overclocked?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 4,
      },
    ],
  },

  {
    name: "Mainboard",
    questions: [
      {
        label: "Does the mainboard POST and boot normally?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Do all RAM slots, PCIe slots, and ports work?",
        answerType: "SELECT",
        options: ["All working", "Some issues", "Not working"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Is the CPU socket in good condition?",
        answerType: "SELECT",
        options: ["No bent pins", "Minor damage", "Major damage"],
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "Is the I/O shield included?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 4,
      },
    ],
  },

  {
    name: "Case",
    questions: [
      {
        label: "Do the front panel ports and buttons work?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 1,
      },
      {
        label: "Are the side panels in good condition?",
        answerType: "SELECT",
        options: ["No damage", "Scratches", "Cracked or broken"],
        isRequired: true,
        sortOrder: 2,
      },
      {
        label: "Do the included fans work properly?",
        answerType: "SELECT",
        options: ["All working", "Some issues", "No fans included"],
        isRequired: true,
        sortOrder: 3,
      },
      {
        label: "Are all screws and accessories included?",
        answerType: "BOOLEAN",
        options: null,
        isRequired: true,
        sortOrder: 4,
      },
    ],
  },
];

/*
 * node prisma/mock.js                          wipe and recreate everything
 * node prisma/mock.js --only=CPU,Mainboard,Case add only these Categories,
 *                                              keeping existing data
 */
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyNames = onlyArg
  ? onlyArg
      .slice("--only=".length)
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  : null;

const main = async () => {
  let categoriesToCreate = mockCategories;

  if (onlyNames) {
    const unknownNames = onlyNames.filter(
      (name) => !mockCategories.some((item) => item.name === name),
    );

    if (unknownNames.length > 0) {
      throw new Error(`Unknown Categories: ${unknownNames.join(", ")}`);
    }

    const existing = await prisma.category.findMany({
      where: { name: { in: onlyNames } },
      select: { name: true },
    });

    const existingNames = existing.map((category) => category.name);

    for (const name of existingNames) {
      console.log(`Skipped ${name}: Category already exists`);
    }

    categoriesToCreate = mockCategories.filter(
      (item) =>
        onlyNames.includes(item.name) && !existingNames.includes(item.name),
    );
  } else {
    console.log("Cleaning existing listing test data...");

    await prisma.$transaction([
      prisma.sellerConditionAnswer.deleteMany(),
      prisma.listingImage.deleteMany(),
      prisma.listing.deleteMany(),
      prisma.conditionQuestion.deleteMany(),
      prisma.category.deleteMany(),
    ]);
  }

  console.log("Creating categories and condition questions...");

  for (const item of categoriesToCreate) {
    const category = await prisma.category.create({
      data: {
        name: item.name,
        isActive: true,
      },
    });

    await prisma.conditionQuestion.createMany({
      data: item.questions.map((question) => ({
        categoryId: category.id,
        label: question.label,
        answerType: question.answerType,
        options: question.options,
        isRequired: question.isRequired,
        isActive: true,
        sortOrder: question.sortOrder,
      })),
    });

    console.log(
      `Created ${category.name} with ${item.questions.length} questions`,
    );
  }

  console.log("Seed completed successfully.");
};

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
