export const questions = [
  // ===== ХРОНИЧЕСКИЕ ЗАБОЛЕВАНИЯ (2 вопроса) =====
  {
    id: 'q1',
    sectionIntro: { icon: "📋", title: "История здоровья", desc: "Расскажите о вашем состоянии" },
    text: "Какие хронические заболевания у вас есть?",
    type: "textarea",
    placeholder: "Гастрит, диабет, гипотиреоз, аллергии..."
  },
  {
    id: 'q2',
    text: "Какие лекарства, БАДы или витамины принимаете?",
    type: "textarea",
    placeholder: "Витамин D — 4000 МЕ, Магний на ночь, Л-тироксин..."
  },

  // ===== ЖЕНСКОЕ ЗДОРОВЬЕ (3 вопроса) — только для female =====
  { 
    id: 'q3',
    sectionIntro: { icon: "💜", title: "Женское здоровье", desc: "Важно для понимания гормонального фона" },
    text: "Менструальный цикл",
    type: "single",
    options: [
      { label: "Регулярный (21-35 дней)", value: "regular" },
      { label: "Нерегулярный", value: "irregular" },
      { label: "Отсутствует (менопауза)", value: "absent" }
    ],
    genderFilter: "female"
  },
  { 
    id: 'q4',
    text: "Характер менструаций",
    type: "multi",
    options: [
      { label: "Обильные", value: "heavy" },
      { label: "Скудные", value: "scanty" },
      { label: "Болезненные", value: "painful" },
      { label: "Сильный ПМС", value: "pms" },
      { label: "Всё в норме", value: "normal" }
    ],
    genderFilter: "female"
  },
  { 
    id: 'q5',
    text: "Текущий статус",
    type: "multi",
    options: [
      { label: "Планирую беременность", value: "planning" },
      { label: "Сейчас беременна", value: "pregnant" },
      { label: "Кормлю грудью", value: "breastfeeding" },
      { label: "Ничего из этого", value: "none" }
    ],
    genderFilter: "female"
  },

  // ===== МУЖСКОЕ ЗДОРОВЬЕ (1 вопрос) — только для male =====
  { 
    id: 'q6',
    sectionIntro: { icon: "💙", title: "Мужское здоровье", desc: "Важно для понимания гормонального фона" },
    text: "Есть ли проблемы в этих областях?",
    type: "multi",
    options: [
      { label: "Снижение либидо", value: "low-libido" },
      { label: "Проблемы с потенцией", value: "ed" },
      { label: "Постоянная усталость", value: "fatigue" },
      { label: "Частое мочеиспускание", value: "urination" },
      { label: "Всё в порядке", value: "ok" }
    ],
    genderFilter: "male"
  },

  // ===== 30 СИМПТОМОВ С КАРТИНКАМИ (Yes/No) =====
  { 
    id: 's1',
    sectionIntro: { icon: "🩺", title: "Симптомы и жалобы", desc: "Отметьте всё, что вас беспокоит" },
    text: "Слабость, повышенная утомляемость?",
    type: "yesno",
    image: "https://static.tildacdn.com/tild6461-6539-4266-b730-343037346539/1.png",
    symptom: "fatigue"
  },
  { 
    id: 's2',
    text: "Хроническая усталость?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3264-3735-4638-b537-363630623534/5.png", 
    symptom: "chronic_fatigue" 
  },
  { 
    id: 's3',
    text: "Раздражительность, перепады настроения?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6364-3533-4330-b339-396265613936/3.png", 
    symptom: "irritability" 
  },
  { 
    id: 's4',
    text: "Сухость слизистых (губы, нос, глаза)?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3365-6430-4966-a262-636338666432/49.png", 
    symptom: "dry_mucous" 
  },
  { 
    id: 's5',
    text: "Тёмные круги под глазами?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6230-6639-4461-a336-366165303865/30.jpeg", 
    symptom: "dark_circles" 
  },
  { 
    id: 's6',
    text: "Частые простуды, вирусные заболевания?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3263-6232-4361-a565-316632363864/59.png", 
    symptom: "frequent_colds" 
  },
  { 
    id: 's7',
    text: "Отёки лица, век, ног, следы от носков?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3562-3031-4465-a264-386530376636/29.jpeg", 
    symptom: "edema" 
  },
  { 
    id: 's8',
    text: "Бледная кожа с зеленоватым/синюшным оттенком?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3861-6263-4139-b637-646230613034/33.jpeg", 
    symptom: "pale_skin" 
  },
  { 
    id: 's9',
    text: "Желтушность ладоней и стоп?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6461-3533-4330-b838-306233383436/34.jpeg", 
    symptom: "yellow_skin" 
  },
  { 
    id: 's10',
    text: "Тяга к сладкому и мучному?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6466-3131-4366-a131-623362303562/52.jpeg", 
    symptom: "sugar_cravings" 
  },
  { 
    id: 's11',
    text: "Постоянное чувство голода, даже после еды?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3863-3035-4230-b764-346664653036/54.png", 
    symptom: "constant_hunger" 
  },
  { 
    id: 's12',
    text: "Сниженный аппетит?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3262-6265-4566-a336-393937383265/56.png", 
    symptom: "low_appetite" 
  },
  { 
    id: 's13',
    text: "Ломкость, выпадение, тусклость волос?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6462-3138-4166-b431-356138613434/41.jpeg", 
    symptom: "hair_loss" 
  },
  { 
    id: 's14',
    text: "Ранняя седина (до 40 лет)?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3066-3862-4133-b830-343461656462/42.jpeg", 
    symptom: "early_gray" 
  },
  { 
    id: 's15',
    text: "Медленное заживление ран?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6362-6264-4765-b137-613436383665/43.jpeg", 
    symptom: "slow_healing" 
  },
  { 
    id: 's16',
    text: "Мышечные боли, судороги?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3839-3631-4730-a262-653837373063/44.jpeg", 
    symptom: "muscle_pain" 
  },
  { 
    id: 's17',
    text: "Непереносимость холода, мерзлявость?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6234-6163-4534-b038-663763323833/45.png", 
    symptom: "cold_intolerance" 
  },
  { 
    id: 's18',
    text: "Тошнота, тяжесть после жирной пищи?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6438-6433-4961-b465-373938653661/61.png", 
    symptom: "nausea_fatty" 
  },
  { 
    id: 's19',
    text: "Вздутие, урчание, тяжесть в животе?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3061-3132-4139-b939-623333663563/62.png", 
    symptom: "bloating" 
  },
  { 
    id: 's20',
    text: "Изжога, рефлюкс?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6332-3265-4465-b564-613737336661/63.png", 
    symptom: "reflux" 
  },
  { 
    id: 's21',
    text: "Запоры?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3262-6539-4238-b539-363132653030/64.png", 
    symptom: "constipation" 
  },
  { 
    id: 's22',
    text: "Боли в правом подреберье?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6166-6237-4537-b133-346331663638/65.jpeg", 
    symptom: "right_side_pain" 
  },
  { 
    id: 's23',
    text: "Стойкий неприятный запах в туалете?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3061-3330-4966-a634-663562383963/67.png", 
    symptom: "stool_smell" 
  },
  { 
    id: 's24',
    text: "Частое подкашливание, першение в горле?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3437-3035-4635-a533-386436663164/68.jpeg", 
    symptom: "coughing" 
  },
  { 
    id: 's25',
    text: "Потливость днём и ночью?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3938-6132-4336-b431-303437333531/69.png", 
    symptom: "sweating" 
  },
  { 
    id: 's26',
    text: "Жировые отложения на животе?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6239-6265-4632-a531-656130363431/70.jpeg", 
    symptom: "belly_fat" 
  },
  { 
    id: 's27',
    text: "Трудности с засыпанием, ночные пробуждения?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6564-6535-4036-a339-333961663632/71.jpeg", 
    symptom: "sleep_problems" 
  },
  { 
    id: 's28',
    text: "Пробуждения после 3-х ночи?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3261-3262-4765-b466-376233616231/a0f81a97-05f.webp", 
    symptom: "early_waking" 
  },
  { 
    id: 's29',
    text: "Слабость и головокружение при вставании?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3138-3735-4034-b033-623133376639/7.png", 
    symptom: "orthostatic" 
  },
  { 
    id: 's30',
    text: "Апатия, потеря интереса, низкая мотивация?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6562-6531-4364-b364-323935383837/9.png", 
    symptom: "apathy" 
  },
  { 
    id: 's31',
    text: "Депрессия, подавленность?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3538-6332-4262-b564-383736643266/10.png", 
    symptom: "depression" 
  },
  { 
    id: 's32',
    text: "Сухая, шелушащаяся кожа, трещины?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3861-3139-4462-a566-326264376139/16.jpeg", 
    symptom: "dry_skin" 
  },
  { 
    id: 's33',
    text: "Белый налёт на языке?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6435-3230-4638-b737-386630396462/20.jpeg", 
    symptom: "tongue_coating" 
  },
  { 
    id: 's34',
    text: "Горечь во рту?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild3362-3930-4135-b063-376433316333/d579712834c914f03601.png", 
    symptom: "bitter_taste" 
  },
  { 
    id: 's35',
    text: "Панические атаки, тревожность?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6336-3637-4565-a366-343532386362/i_4.webp", 
    symptom: "anxiety" 
  },
  { 
    id: 's36',
    text: "Холодные конечности?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6632-3834-4963-a164-323238356464/i_6.webp", 
    symptom: "cold_extremities" 
  },
  { 
    id: 's37',
    text: "Проблемы с концентрацией и памятью?", 
    type: "yesno",
    image: "https://static.tildacdn.com/tild6161-3330-4562-a238-336332653739/i_8.webp", 
    symptom: "brain_fog" 
  },

  // ===== ОБРАЗ ЖИЗНИ (4 вопроса) =====
  {
    id: 'l1',
    sectionIntro: { icon: "🥗", title: "Образ жизни", desc: "Несколько вопросов о привычках" },
    text: "Сколько воды пьёте в день?",
    type: "single",
    options: [
      { label: "Менее 1 литра", value: "less-1" },
      { label: "1-1.5 литра", value: "1-1.5" },
      { label: "1.5-2 литра", value: "1.5-2" },
      { label: "Более 2 литров", value: "more-2" }
    ]
  },
  {
    id: 'l2',
    text: "Сколько часов спите?",
    type: "single",
    options: [
      { label: "Менее 6 часов", value: "less-6" },
      { label: "6-7 часов", value: "6-7" },
      { label: "7-8 часов", value: "7-8" },
      { label: "Более 8 часов", value: "more-8" }
    ]
  },
  {
    id: 'l3',
    text: "Как часто употребляете алкоголь?",
    type: "single",
    options: [
      { label: "Не употребляю", value: "never" },
      { label: "Редко (пару раз в год)", value: "rare" },
      { label: "Несколько раз в месяц", value: "monthly" },
      { label: "Каждую неделю", value: "weekly" }
    ]
  },
  {
    id: 'l4',
    text: "Курение",
    type: "single",
    options: [
      { label: "Не курю", value: "no" },
      { label: "Бросил(а)", value: "quit" },
      { label: "Курю", value: "yes" },
      { label: "Вейп / электронные", value: "vape" }
    ]
  }
];

export function filterQuestionsByGender(gender) {
  return questions.filter(q => {
    if (!q.genderFilter) return true;
    return q.genderFilter === gender;
  });
}

