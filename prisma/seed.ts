import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const CONTESTS_DATA = [
  {
    year: 2025,
    city: "Basel",
    stage: "ALL",
    entries: [
      { country: "Albania", artist: "Shkodra Elektronike", songTitle: "Zjerm", videoUrl: "https://www.youtube.com/embed/xfn6ssOf_zU" },
      { country: "Armenia", artist: "Parg", songTitle: "Survivor", videoUrl: "https://www.youtube.com/embed/qHkZWLld-pw" },
      { country: "Australia", artist: "Go-Jo", songTitle: "Milkshake Man", videoUrl: "https://www.youtube.com/embed/EJ0RdIU_G8g" },
      { country: "Austria", artist: "JJ", songTitle: "Wasted Love", videoUrl: "https://www.youtube.com/embed/onOex2WXjbA" },
      { country: "Azerbaijan", artist: "Mamagama", songTitle: "Run with U", videoUrl: "https://www.youtube.com/embed/wk1CUjaRKyo" },
      { country: "Belgium", artist: "Red Sebastian", songTitle: "Strobe Lights", videoUrl: "https://www.youtube.com/embed/fl4LaADiLBY" },
      { country: "Croatia", artist: "Marko Bošnjak", songTitle: "Poison Cake", videoUrl: "https://www.youtube.com/embed/jzK4D_gfRjQ" },
      { country: "Cyprus", artist: "Theo Evan", songTitle: "Shh", videoUrl: "https://www.youtube.com/embed/egPAiAuC57k" },
      { country: "Czechia", artist: "Adonxs", songTitle: "Kiss Kiss Goodbye", videoUrl: "https://www.youtube.com/embed/hdxna1DC7yo" },
      { country: "Denmark", artist: "Sissal", songTitle: "Hallucination", videoUrl: "https://www.youtube.com/embed/B3BdsYDnS8M" },
      { country: "Estonia", artist: "Tommy Cash", songTitle: "Espresso Macchiato", videoUrl: "https://www.youtube.com/embed/F3wsy8bywXQ" },
      { country: "Finland", artist: "Erika Vikman", songTitle: "Ich komme", videoUrl: "https://www.youtube.com/embed/V3vbVd1ynnk" },
      { country: "France", artist: "Louane", songTitle: "maman", videoUrl: "https://www.youtube.com/embed/jhqJY0ll1Wo" },
      { country: "Georgia", artist: "Mariam Shengelia", songTitle: "Freedom", videoUrl: "https://www.youtube.com/embed/jphJoo-CNtU" },
      { country: "Germany", artist: "Abor & Tynna", songTitle: "Baller", videoUrl: "https://www.youtube.com/embed/3rrWZ6cldsA" },
      { country: "Greece", artist: "Klavdia", songTitle: "Asteromata", videoUrl: "https://www.youtube.com/embed/1qbWRl6h6to" },
      { country: "Iceland", artist: "Væb", songTitle: "Róa", videoUrl: "https://www.youtube.com/embed/c73Lx1QUZZA" },
      { country: "Ireland", artist: "Emmy", songTitle: "Laika Party", videoUrl: "https://www.youtube.com/embed/3MB628Kanzo" },
      { country: "Israel", artist: "Yuval Raphael", songTitle: "New Day Will Rise", videoUrl: "https://www.youtube.com/embed/_7zHp51j2WM" },
      { country: "Italy", artist: "Lucio Corsi", songTitle: "Volevo essere un duro", videoUrl: "https://www.youtube.com/embed/Vlu5XXDwHos" },
      { country: "Latvia", artist: "Tautumeitas", songTitle: "Bur man laimi", videoUrl: "https://www.youtube.com/embed/nkvcMe3NiQ0" },
      { country: "Lithuania", artist: "Katarsis", songTitle: "Tavo akys", videoUrl: "https://www.youtube.com/embed/R2f2aZ6Fy58" },
      { country: "Luxembourg", artist: "Laura Thorn", songTitle: "La poupée monte le son", videoUrl: "https://www.youtube.com/embed/GT7ZZBCscUg" },
      { country: "Malta", artist: "Miriana Conte", songTitle: "Serving", videoUrl: "https://www.youtube.com/embed/povnGP6k0sI" },
      { country: "Montenegro", artist: "Nina Žižić", songTitle: "Dobrodošli", videoUrl: "https://www.youtube.com/embed/L9MNHACTvT0" },
      { country: "Netherlands", artist: "Claude", songTitle: "C'est la vie", videoUrl: "https://www.youtube.com/embed/LiTQVJwxvfE" },
      { country: "Norway", artist: "Kyle Alessandro", songTitle: "Lighter", videoUrl: "https://www.youtube.com/embed/gQOGxx6Fk9k" },
      { country: "Poland", artist: "Justyna Steczkowska", songTitle: "Gaja", videoUrl: "https://www.youtube.com/embed/eg5RtEX1zJ0" },
      { country: "Portugal", artist: "Napa", songTitle: "Deslocado", videoUrl: "https://www.youtube.com/embed/waInyqBwSo0" },
      { country: "San Marino", artist: "Gabry Ponte", songTitle: "Tutta l'Italia", videoUrl: "https://www.youtube.com/embed/hq6XIRKmA2A" },
      { country: "Serbia", artist: "Princ", songTitle: "Mila", videoUrl: "https://www.youtube.com/embed/WlCoZ0UOXoY" },
      { country: "Slovenia", artist: "Klemen", songTitle: "How Much Time Do We Have Left", videoUrl: "https://www.youtube.com/embed/Jbs9WlvIkg0" },
      { country: "Spain", artist: "Melody", songTitle: "Esa diva", videoUrl: "https://www.youtube.com/embed/IEKSa9FVLqA" },
      { country: "Sweden", artist: "KAJ", songTitle: "Bara bada bastu", videoUrl: "https://www.youtube.com/embed/WSh7U3m9KgA" },
      { country: "Switzerland", artist: "Zoë Më", songTitle: "Voyage", videoUrl: "https://www.youtube.com/embed/5TMc6HzimQo" },
      { country: "Ukraine", artist: "Ziferblat", songTitle: "Bird of Pray", videoUrl: "https://www.youtube.com/embed/-DG0l8sSNJM" },
      { country: "United Kingdom", artist: "Remember Monday", songTitle: "What the Hell Just Happened?", videoUrl: "https://www.youtube.com/embed/Ur5qRh0BaHk" }
    ]
  },
  {
    year: 2025,
    city: "Basel",
    stage: "FINAL",
    entries: [
      { country: "Norway", artist: "Kyle Alessandro", songTitle: "Lighter", videoUrl: "https://www.youtube.com/embed/gQOGxx6Fk9k" },
      { country: "Luxembourg", artist: "Laura Thorn", songTitle: "La poupée monte le son", videoUrl: "https://www.youtube.com/embed/GT7ZZBCscUg" },
      { country: "Estonia", artist: "Tommy Cash", songTitle: "Espresso Macchiato", videoUrl: "https://www.youtube.com/embed/F3wsy8bywXQ" },
      { country: "Israel", artist: "Yuval Raphael", songTitle: "New Day Will Rise", videoUrl: "https://www.youtube.com/embed/_7zHp51j2WM" },
      { country: "Lithuania", artist: "Katarsis", songTitle: "Tavo akys", videoUrl: "https://www.youtube.com/embed/R2f2aZ6Fy58" },
      { country: "Spain", artist: "Melody", songTitle: "Esa diva", videoUrl: "https://www.youtube.com/embed/IEKSa9FVLqA" },
      { country: "Ukraine", artist: "Ziferblat", songTitle: "Bird of Pray", videoUrl: "https://www.youtube.com/embed/-DG0l8sSNJM" },
      { country: "United Kingdom", artist: "Remember Monday", songTitle: "What the Hell Just Happened?", videoUrl: "https://www.youtube.com/embed/Ur5qRh0BaHk" },
      { country: "Austria", artist: "JJ", songTitle: "Wasted Love", videoUrl: "https://www.youtube.com/embed/onOex2WXjbA" },
      { country: "Iceland", artist: "Væb", songTitle: "Róa", videoUrl: "https://www.youtube.com/embed/c73Lx1QUZZA" },
      { country: "Latvia", artist: "Tautumeitas", songTitle: "Bur man laimi", videoUrl: "https://www.youtube.com/embed/nkvcMe3NiQ0" },
      { country: "Netherlands", artist: "Claude", songTitle: "C'est la vie", videoUrl: "https://www.youtube.com/embed/LiTQVJwxvfE" },
      { country: "Finland", artist: "Erika Vikman", songTitle: "Ich komme", videoUrl: "https://www.youtube.com/embed/V3vbVd1ynnk" },
      { country: "Italy", artist: "Lucio Corsi", songTitle: "Volevo essere un duro", videoUrl: "https://www.youtube.com/embed/Vlu5XXDwHos" },
      { country: "Poland", artist: "Justyna Steczkowska", songTitle: "Gaja", videoUrl: "https://www.youtube.com/embed/eg5RtEX1zJ0" },
      { country: "Germany", artist: "Abor & Tynna", songTitle: "Baller", videoUrl: "https://www.youtube.com/embed/3rrWZ6cldsA" },
      { country: "Greece", artist: "Klavdia", songTitle: "Asteromata", videoUrl: "https://www.youtube.com/embed/1qbWRl6h6to" },
      { country: "Armenia", artist: "Parg", songTitle: "Survivor", videoUrl: "https://www.youtube.com/embed/qHkZWLld-pw" },
      { country: "Switzerland", artist: "Zoë Më", songTitle: "Voyage", videoUrl: "https://www.youtube.com/embed/5TMc6HzimQo" },
      { country: "Malta", artist: "Miriana Conte", songTitle: "Serving", videoUrl: "https://www.youtube.com/embed/povnGP6k0sI" },
      { country: "Portugal", artist: "Napa", songTitle: "Deslocado", videoUrl: "https://www.youtube.com/embed/waInyqBwSo0" },
      { country: "Denmark", artist: "Sissal", songTitle: "Hallucination", videoUrl: "https://www.youtube.com/embed/B3BdsYDnS8M" },
      { country: "Sweden", artist: "KAJ", songTitle: "Bara bada bastu", videoUrl: "https://www.youtube.com/embed/WSh7U3m9KgA" },
      { country: "France", artist: "Louane", songTitle: "maman", videoUrl: "https://www.youtube.com/embed/jhqJY0ll1Wo" },
      { country: "San Marino", artist: "Gabry Ponte", songTitle: "Tutta l'Italia", videoUrl: "https://www.youtube.com/embed/hq6XIRKmA2A" },
      { country: "Albania", artist: "Shkodra Elektronike", songTitle: "Zjerm", videoUrl: "https://www.youtube.com/embed/xfn6ssOf_zU" }
    ]
  },
  {
    year: 2024,
    city: "Malmö",
    stage: "ALL",
    entries: [
      { country: "Albania", artist: "Besa", songTitle: "Titan", videoUrl: "https://www.youtube.com/embed/aQG22XJIdWw" },
      { country: "Armenia", artist: "Ladaniva", songTitle: "Jako", videoUrl: "https://www.youtube.com/embed/hAYXDoZzAyE" },
      { country: "Australia", artist: "Electric Fields", songTitle: "One Milkali (One Blood)", videoUrl: "https://www.youtube.com/embed/Wzpp6996QdI" },
      { country: "Austria", artist: "Kaleen", songTitle: "We Will Rave", videoUrl: "https://www.youtube.com/embed/VZ6SlZnk_EI" },
      { country: "Azerbaijan", artist: "Fahree feat. Ilkin Dovlatov", songTitle: "Özünlə apar", videoUrl: "https://www.youtube.com/embed/QhN9r8TH2Hw" },
      { country: "Belgium", artist: "Mustii", songTitle: "Before The Party's Over", videoUrl: "https://www.youtube.com/embed/hNIemQwCaM4" },
      { country: "Croatia", artist: "Baby Lasagna", songTitle: "Rim Tim Tagi Dim", videoUrl: "https://www.youtube.com/embed/YIBjarAiAVc" },
      { country: "Cyprus", artist: "Silia Kapsis", songTitle: "Liar", videoUrl: "https://www.youtube.com/embed/c4wMioZXbMk" },
      { country: "Czechia", artist: "Aiko", songTitle: "Pedestal", videoUrl: "https://www.youtube.com/embed/RiItbHRF1BY" },
      { country: "Denmark", artist: "Saba", songTitle: "Sand", videoUrl: "https://www.youtube.com/embed/4f_phiGot7w" },
      { country: "Estonia", artist: "5miinust and Puuluup", songTitle: "(Nendest) narkootikumidest ei tea me (küll) midagi", videoUrl: "https://www.youtube.com/embed/RSMMU2wX0Bk" },
      { country: "Finland", artist: "Windows95man", songTitle: "No Rules!", videoUrl: "https://www.youtube.com/embed/7nidDtyS0Wo" },
      { country: "France", artist: "Slimane", songTitle: "Mon amour", videoUrl: "https://www.youtube.com/embed/-XyLecY2JyE" },
      { country: "Georgia", artist: "Nutsa Buzaladze", songTitle: "Firefighter", videoUrl: "https://www.youtube.com/embed/He4PGhm7jOw" },
      { country: "Germany", artist: "Isaak", songTitle: "Always on the Run", videoUrl: "https://www.youtube.com/embed/kVOHTxFOhak" },
      { country: "Greece", artist: "Marina Satti", songTitle: "ZARI", videoUrl: "https://www.youtube.com/embed/ENb4LCeq9Lc" },
      { country: "Iceland", artist: "Hera Björk", songTitle: "Scared of Heights", videoUrl: "https://www.youtube.com/embed/VChBgcycVl8" },
      { country: "Ireland", artist: "Bambie Thug", songTitle: "Doomsday Blue", videoUrl: "https://www.youtube.com/embed/UMq8ofCstMQ" },
      { country: "Israel", artist: "Eden Golan", songTitle: "Hurricane", videoUrl: "https://www.youtube.com/embed/K60BWlEhtAA" },
      { country: "Italy", artist: "Angelina Mango", songTitle: "La noia", videoUrl: "https://www.youtube.com/embed/zp1FXHjkjpQ" },
      { country: "Latvia", artist: "Dons", songTitle: "Hollow", videoUrl: "https://www.youtube.com/embed/kgIwQkMwURY" },
      { country: "Lithuania", artist: "Silvester Belt", songTitle: "Luktelk", videoUrl: "https://www.youtube.com/embed/N8YuQzJLR_k" },
      { country: "Luxembourg", artist: "Tali", songTitle: "Fighter", videoUrl: "https://www.youtube.com/embed/TCWH3Nq5y9A" },
      { country: "Malta", artist: "Sarah Bonnici", songTitle: "Loop", videoUrl: "https://www.youtube.com/embed/uG-JHeia13c" },
      { country: "Moldova", artist: "Natalia Barbu", songTitle: "In the Middle", videoUrl: "https://www.youtube.com/embed/evIoGkZXj2s" },
      { country: "Netherlands", artist: "Joost Klein", songTitle: "Europapa", videoUrl: "https://www.youtube.com/embed/IiHFnmI8pxg" },
      { country: "Norway", artist: "Gåte", songTitle: "Ulveham", videoUrl: "https://www.youtube.com/embed/YBbL8ORqNVU" },
      { country: "Poland", artist: "Luna", songTitle: "The Tower", videoUrl: "https://www.youtube.com/embed/ESKG8Uo1YaU" },
      { country: "Portugal", artist: "Iolanda", songTitle: "Grito", videoUrl: "https://www.youtube.com/embed/OZn4-H6JvKU" },
      { country: "San Marino", artist: "Megara", songTitle: "11:11", videoUrl: "https://www.youtube.com/embed/IqyJvkGmAjo" },
      { country: "Serbia", artist: "Teya Dora", songTitle: "Ramonda", videoUrl: "https://www.youtube.com/embed/4hUg64uIY_4" },
      { country: "Slovenia", artist: "Raiven", songTitle: "Veronika", videoUrl: "https://www.youtube.com/embed/l86DxpRnz5M" },
      { country: "Spain", artist: "Nebulossa", songTitle: "Zorra", videoUrl: "https://www.youtube.com/embed/FOMoQoHG5aU" },
      { country: "Sweden", artist: "Marcus & Martinus", songTitle: "Unforgettable", videoUrl: "https://www.youtube.com/embed/DcZpzObYzxs" },
      { country: "Switzerland", artist: "Nemo", songTitle: "The Code", videoUrl: "https://www.youtube.com/embed/CO_qJf-nW0k" },
      { country: "Ukraine", artist: "alyona alyona & Jerry Heil", songTitle: "Teresa & Maria", videoUrl: "https://www.youtube.com/embed/d4N82wPpdg8" },
      { country: "United Kingdom", artist: "Olly Alexander", songTitle: "Dizzy", videoUrl: "https://www.youtube.com/embed/q0_FdJqyQW0" }
    ]
  },
  {
    year: 2024,
    city: "Malmö",
    stage: "FINAL",
    entries: [
      { country: "Sweden", artist: "Marcus & Martinus", songTitle: "Unforgettable", videoUrl: "https://www.youtube.com/embed/DcZpzObYzxs" },
      { country: "Ukraine", artist: "alyona alyona & Jerry Heil", songTitle: "Teresa & Maria", videoUrl: "https://www.youtube.com/embed/d4N82wPpdg8" },
      { country: "Germany", artist: "Isaak", songTitle: "Always on the Run", videoUrl: "https://www.youtube.com/embed/kVOHTxFOhak" },
      { country: "Luxembourg", artist: "Tali", songTitle: "Fighter", videoUrl: "https://www.youtube.com/embed/TCWH3Nq5y9A" },
      { country: "Netherlands", artist: "Joost Klein", songTitle: "Europapa", videoUrl: "https://www.youtube.com/embed/IiHFnmI8pxg" },
      { country: "Israel", artist: "Eden Golan", songTitle: "Hurricane", videoUrl: "https://www.youtube.com/embed/K60BWlEhtAA" },
      { country: "Lithuania", artist: "Silvester Belt", songTitle: "Luktelk", videoUrl: "https://www.youtube.com/embed/N8YuQzJLR_k" },
      { country: "Spain", artist: "Nebulossa", songTitle: "Zorra", videoUrl: "https://www.youtube.com/embed/FOMoQoHG5aU" },
      { country: "Estonia", artist: "5miinust and Puuluup", songTitle: "(Nendest) narkootikumidest ei tea me (küll) midagi", videoUrl: "https://www.youtube.com/embed/RSMMU2wX0Bk" },
      { country: "Ireland", artist: "Bambie Thug", songTitle: "Doomsday Blue", videoUrl: "https://www.youtube.com/embed/UMq8ofCstMQ" },
      { country: "Latvia", artist: "Dons", songTitle: "Hollow", videoUrl: "https://www.youtube.com/embed/kgIwQkMwURY" },
      { country: "Greece", artist: "Marina Satti", songTitle: "ZARI", videoUrl: "https://www.youtube.com/embed/ENb4LCeq9Lc" },
      { country: "United Kingdom", artist: "Olly Alexander", songTitle: "Dizzy", videoUrl: "https://www.youtube.com/embed/q0_FdJqyQW0" },
      { country: "Norway", artist: "Gåte", songTitle: "Ulveham", videoUrl: "https://www.youtube.com/embed/YBbL8ORqNVU" },
      { country: "Italy", artist: "Angelina Mango", songTitle: "La noia", videoUrl: "https://www.youtube.com/embed/zp1FXHjkjpQ" },
      { country: "Serbia", artist: "Teya Dora", songTitle: "Ramonda", videoUrl: "https://www.youtube.com/embed/4hUg64uIY_4" },
      { country: "Finland", artist: "Windows95man", songTitle: "No Rules!", videoUrl: "https://www.youtube.com/embed/7nidDtyS0Wo" },
      { country: "Portugal", artist: "Iolanda", songTitle: "Grito", videoUrl: "https://www.youtube.com/embed/OZn4-H6JvKU" },
      { country: "Armenia", artist: "Ladaniva", songTitle: "Jako", videoUrl: "https://www.youtube.com/embed/hAYXDoZzAyE" },
      { country: "Cyprus", artist: "Silia Kapsis", songTitle: "Liar", videoUrl: "https://www.youtube.com/embed/c4wMioZXbMk" },
      { country: "Switzerland", artist: "Nemo", songTitle: "The Code", videoUrl: "https://www.youtube.com/embed/CO_qJf-nW0k" },
      { country: "Slovenia", artist: "Raiven", songTitle: "Veronika", videoUrl: "https://www.youtube.com/embed/l86DxpRnz5M" },
      { country: "Croatia", artist: "Baby Lasagna", songTitle: "Rim Tim Tagi Dim", videoUrl: "https://www.youtube.com/embed/YIBjarAiAVc" },
      { country: "Georgia", artist: "Nutsa Buzaladze", songTitle: "Firefighter", videoUrl: "https://www.youtube.com/embed/He4PGhm7jOw" },
      { country: "France", artist: "Slimane", songTitle: "Mon amour", videoUrl: "https://www.youtube.com/embed/-XyLecY2JyE" },
      { country: "Austria", artist: "Kaleen", songTitle: "We Will Rave", videoUrl: "https://www.youtube.com/embed/VZ6SlZnk_EI" }
    ]
  },
  {
    year: 2023,
    city: "Liverpool",
    stage: "ALL",
    entries: [
      { country: "Albania", artist: "Albina & Familja Kelmendi", songTitle: "Duje", videoUrl: "https://www.youtube.com/embed/TI9rSDhXwyc" },
      { country: "Armenia", artist: "Brunette", songTitle: "Future Lover", videoUrl: "https://www.youtube.com/embed/h0q7AkYk2hY" },
      { country: "Australia", artist: "Voyager", songTitle: "Promise", videoUrl: "https://www.youtube.com/embed/GSoy_mJMlMY" },
      { country: "Austria", artist: "Teya & Salena", songTitle: "Who the Hell Is Edgar?", videoUrl: "https://www.youtube.com/embed/8uk64V9h0Ko" },
      { country: "Azerbaijan", artist: "TuralTuranX", songTitle: "Tell Me More", videoUrl: "https://www.youtube.com/embed/8BNtaW1IEtA" },
      { country: "Belgium", artist: "Gustaph", songTitle: "Because Of You", videoUrl: "https://www.youtube.com/embed/U1xD14IMKtg" },
      { country: "Croatia", artist: "Let 3", songTitle: "Mama ŠČ!", videoUrl: "https://www.youtube.com/embed/hGuGfdEJ5Pw" },
      { country: "Cyprus", artist: "Andrew Lambrou", songTitle: "Break a Broken Heart", videoUrl: "https://www.youtube.com/embed/49YiimKeyDI" },
      { country: "Czechia", artist: "Vesna", songTitle: "My Sister's Crown", videoUrl: "https://www.youtube.com/embed/ag8qxpvTTy0" },
      { country: "Denmark", artist: "Reiley", songTitle: "Breaking My Heart", videoUrl: "https://www.youtube.com/embed/XVZvzZF1JOk" },
      { country: "Estonia", artist: "Alika", songTitle: "Bridges", videoUrl: "https://www.youtube.com/embed/HsbC-OYMA3s" },
      { country: "Finland", artist: "Käärijä", songTitle: "Cha Cha Cha", videoUrl: "https://www.youtube.com/embed/l6rS8Dv5g-8" },
      { country: "France", artist: "La Zarra", songTitle: "Évidemment", videoUrl: "https://www.youtube.com/embed/fOtQJ4o-HoA" },
      { country: "Georgia", artist: "Iru", songTitle: "Echo", videoUrl: "https://www.youtube.com/embed/HNvGZeEQvfc" },
      { country: "Germany", artist: "Lord of the Lost", songTitle: "Blood & Glitter", videoUrl: "https://www.youtube.com/embed/dyGR4YWlPEs" },
      { country: "Greece", artist: "Victor Vernicos", songTitle: "What They Say", videoUrl: "https://www.youtube.com/embed/gJSZA0Zh2xU" },
      { country: "Iceland", artist: "Diljá", songTitle: "Power", videoUrl: "https://www.youtube.com/embed/lzlTcA0OC5s" },
      { country: "Ireland", artist: "Wild Youth", songTitle: "We Are One", videoUrl: "https://www.youtube.com/embed/80-4_rjW10U" },
      { country: "Israel", artist: "Noa Kirel", songTitle: "Unicorn", videoUrl: "https://www.youtube.com/embed/Z3mIcCllJXY" },
      { country: "Italy", artist: "Marco Mengoni", songTitle: "Due Vite", videoUrl: "https://www.youtube.com/embed/d6IiOSut_4M" },
      { country: "Latvia", artist: "Sudden Lights", songTitle: "Aijā", videoUrl: "https://www.youtube.com/embed/SEykwl9X9SY" },
      { country: "Lithuania", artist: "Monika Linkytė", songTitle: "Stay", videoUrl: "https://www.youtube.com/embed/QsgouAEd34U" },
      { country: "Malta", artist: "The Busker", songTitle: "Dance (Our Own Party)", videoUrl: "https://www.youtube.com/embed/zVmVt9qmg9g" },
      { country: "Moldova", artist: "Pasha Parfeni", songTitle: "Soarele și luna", videoUrl: "https://www.youtube.com/embed/SABOfYgGk8M" },
      { country: "Netherlands", artist: "Mia Nicolai & Dion Cooper", songTitle: "Burning Daylight", videoUrl: "https://www.youtube.com/embed/3XAsam043OY" },
      { country: "Norway", artist: "Alessandra", songTitle: "Queen of Kings", videoUrl: "https://www.youtube.com/embed/PUHSM_vTqTI" },
      { country: "Poland", artist: "Blanka", songTitle: "Solo", videoUrl: "https://www.youtube.com/embed/SEgF1aP-U1o" },
      { country: "Portugal", artist: "Mimicat", songTitle: "Ai coração", videoUrl: "https://www.youtube.com/embed/HYfkxX4PFyw" },
      { country: "Romania", artist: "Theodor Andrei", songTitle: "D.G.T. (Off and On)", videoUrl: "https://www.youtube.com/embed/Bf3iPXU1RYU" },
      { country: "San Marino", artist: "Piqued Jacks", songTitle: "Like an Animal", videoUrl: "https://www.youtube.com/embed/pIdHjcqyLfo" },
      { country: "Serbia", artist: "Luke Black", songTitle: "Samo mi se spava", videoUrl: "https://www.youtube.com/embed/E89gtz9rdBM" },
      { country: "Slovenia", artist: "Joker Out", songTitle: "Carpe Diem", videoUrl: "https://www.youtube.com/embed/3LXlPviGiWc" },
      { country: "Spain", artist: "Blanca Paloma", songTitle: "Eaea", videoUrl: "https://www.youtube.com/embed/Vw6qPWhjevk" },
      { country: "Sweden", artist: "Loreen", songTitle: "Tattoo", videoUrl: "https://www.youtube.com/embed/BE2Fj0W4jP4" },
      { country: "Switzerland", artist: "Remo Forrer", songTitle: "Watergun", videoUrl: "https://www.youtube.com/embed/l4NDErv49mk" },
      { country: "Ukraine", artist: "Tvorchi", songTitle: "Heart of Steel", videoUrl: "https://www.youtube.com/embed/I2oqDpefJ1s" },
      { country: "United Kingdom", artist: "Mae Muller", songTitle: "I Wrote a Song", videoUrl: "https://www.youtube.com/embed/tvJEE2ryCRQ" }
    ]
  },
  {
    year: 2023,
    city: "Liverpool",
    stage: "FINAL",
    entries: [
      { country: "Austria", artist: "Teya & Salena", songTitle: "Who the Hell Is Edgar?", videoUrl: "https://www.youtube.com/embed/8uk64V9h0Ko" },
      { country: "Portugal", artist: "Mimicat", songTitle: "Ai coração", videoUrl: "https://www.youtube.com/embed/HYfkxX4PFyw" },
      { country: "Switzerland", artist: "Remo Forrer", songTitle: "Watergun", videoUrl: "https://www.youtube.com/embed/l4NDErv49mk" },
      { country: "Poland", artist: "Blanka", songTitle: "Solo", videoUrl: "https://www.youtube.com/embed/SEgF1aP-U1o" },
      { country: "Serbia", artist: "Luke Black", songTitle: "Samo mi se spava", videoUrl: "https://www.youtube.com/embed/E89gtz9rdBM" },
      { country: "France", artist: "La Zarra", songTitle: "Évidemment", videoUrl: "https://www.youtube.com/embed/fOtQJ4o-HoA" },
      { country: "Cyprus", artist: "Andrew Lambrou", songTitle: "Break a Broken Heart", videoUrl: "https://www.youtube.com/embed/49YiimKeyDI" },
      { country: "Spain", artist: "Blanca Paloma", songTitle: "Eaea", videoUrl: "https://www.youtube.com/embed/Vw6qPWhjevk" },
      { country: "Sweden", artist: "Loreen", songTitle: "Tattoo", videoUrl: "https://www.youtube.com/embed/BE2Fj0W4jP4" },
      { country: "Albania", artist: "Albina & Familja Kelmendi", songTitle: "Duje", videoUrl: "https://www.youtube.com/embed/TI9rSDhXwyc" },
      { country: "Italy", artist: "Marco Mengoni", songTitle: "Due Vite", videoUrl: "https://www.youtube.com/embed/d6IiOSut_4M" },
      { country: "Estonia", artist: "Alika", songTitle: "Bridges", videoUrl: "https://www.youtube.com/embed/HsbC-OYMA3s" },
      { country: "Finland", artist: "Käärijä", songTitle: "Cha Cha Cha", videoUrl: "https://www.youtube.com/embed/l6rS8Dv5g-8" },
      { country: "Czechia", artist: "Vesna", songTitle: "My Sister's Crown", videoUrl: "https://www.youtube.com/embed/ag8qxpvTTy0" },
      { country: "Australia", artist: "Voyager", songTitle: "Promise", videoUrl: "https://www.youtube.com/embed/GSoy_mJMlMY" },
      { country: "Belgium", artist: "Gustaph", songTitle: "Because Of You", videoUrl: "https://www.youtube.com/embed/U1xD14IMKtg" },
      { country: "Armenia", artist: "Brunette", songTitle: "Future Lover", videoUrl: "https://www.youtube.com/embed/h0q7AkYk2hY" },
      { country: "Moldova", artist: "Pasha Parfeni", songTitle: "Soarele și luna", videoUrl: "https://www.youtube.com/embed/SABOfYgGk8M" },
      { country: "Ukraine", artist: "Tvorchi", songTitle: "Heart of Steel", videoUrl: "https://www.youtube.com/embed/I2oqDpefJ1s" },
      { country: "Norway", artist: "Alessandra", songTitle: "Queen of Kings", videoUrl: "https://www.youtube.com/embed/PUHSM_vTqTI" },
      { country: "Germany", artist: "Lord of the Lost", songTitle: "Blood & Glitter", videoUrl: "https://www.youtube.com/embed/dyGR4YWlPEs" },
      { country: "Lithuania", artist: "Monika Linkytė", songTitle: "Stay", videoUrl: "https://www.youtube.com/embed/QsgouAEd34U" },
      { country: "Israel", artist: "Noa Kirel", songTitle: "Unicorn", videoUrl: "https://www.youtube.com/embed/Z3mIcCllJXY" },
      { country: "Slovenia", artist: "Joker Out", songTitle: "Carpe Diem", videoUrl: "https://www.youtube.com/embed/3LXlPviGiWc" },
      { country: "Croatia", artist: "Let 3", songTitle: "Mama ŠČ!", videoUrl: "https://www.youtube.com/embed/hGuGfdEJ5Pw" },
      { country: "United Kingdom", artist: "Mae Muller", songTitle: "I Wrote a Song", videoUrl: "https://www.youtube.com/embed/tvJEE2ryCRQ" }
    ]
  }
];

const AVATARS = [
  { name: 'Disco Ball', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=disco' },
  { name: 'Microphone', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=mic' },
  { name: 'Star', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=star' },
  { name: 'Heart', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=heart' },
  { name: 'Music Note', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=note' },
  { name: 'Bomb', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=bomb' },
];

async function main() {
  console.log('🗑️  Cleaning database...');

  await prisma.vote.deleteMany();    
  await prisma.player.deleteMany();  
  await prisma.gameRoom.deleteMany(); 
  await prisma.entry.deleteMany();    
  await prisma.contest.deleteMany();   
  await prisma.avatar.deleteMany();    

  console.log('🌱 Seeding Avatars...');
  await prisma.avatar.createMany({
    data: AVATARS
  });

  console.log('🌱 Seeding Contests & Entries...');
  
  for (const contestData of CONTESTS_DATA) {
    const contest = await prisma.contest.create({
      data: {
        year: contestData.year,
        name: `${contestData.city} ${contestData.year} - ${contestData.stage}`,
        isOfficial: true,
        entries: {
          create: contestData.entries.map((entry, index) => ({
            country: entry.country,
            artist: entry.artist,
            songTitle: entry.songTitle,
            order: index + 1,
            videoUrl: entry.videoUrl
          }))
        }
      }
    });
    console.log(`✅ Created: ESC ${contest.year} with ${contestData.entries.length} songs`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });