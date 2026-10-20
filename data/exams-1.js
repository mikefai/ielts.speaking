(globalThis.EXAMS ??= []).push(
{
  id: 1,
  part1: [
    { topic: 'Hometown', questions: [
      'Where is your hometown?',
      'What do you like most about your hometown?',
      'Has your hometown changed much since you were a child?',
      'Would you recommend your hometown to visitors?',
    ] },
    { topic: 'Daily routine', questions: [
      'What time do you usually get up on weekdays?',
      'Is there a part of your day that you particularly enjoy?',
      'Do you prefer to follow a fixed routine or do things as they come?',
      'Has your daily routine changed in the last few years?',
    ] },
    { topic: 'Family', questions: [
      'How many people are there in your family?',
      'Who in your family are you closest to?',
      'Do you and your family often eat meals together?',
      'What do you enjoy doing with your family at weekends?',
    ] },
  ],
  part2: {
    prompt: 'Describe a teacher who inspired you.',
    bullets: [
      'who the teacher was',
      'when and where you were taught by them',
      'what made their lessons different from others',
      'and explain why this teacher inspired you',
    ],
  },
  part3: {
    theme: 'Education and role models',
    questions: [
      'What qualities do you think make a good teacher?',
      'Do you think students learn better in small classes or in large ones?',
      'How has the role of teachers changed over the last few decades?',
      'Who do young people look up to nowadays, and is that a good thing?',
      'Some people say schools should teach children how to behave as well as academic subjects. What is your view?',
    ],
  },
},
{
  id: 2,
  part1: [
    { topic: 'Work or Study', questions: [
      'Are you working or studying at the moment?',
      'What do you enjoy most about your job or your course?',
      'How do you usually travel to work or to your place of study?',
      'Do you find it easier to concentrate in the morning or in the evening?',
    ] },
    { topic: 'Weather', questions: [
      'What is the weather usually like where you live?',
      'Which season of the year do you like the most, and why?',
      'Do you enjoy rainy days, or do they make you feel gloomy?',
      'Has the weather where you live changed much in recent years?',
    ] },
    { topic: 'Music', questions: [
      'How often do you listen to music?',
      'What kind of music do you enjoy the most?',
      'Do you play a musical instrument, or would you like to learn one?',
      'Is there a song that always makes you feel good?',
    ] },
  ],
  part2: {
    prompt: 'Describe a historic place you visited.',
    bullets: [
      'where this place is and what it is known for',
      'when you visited it and who you went with',
      'what you saw and did while you were there',
      'and explain why this place made a strong impression on you',
    ],
  },
  part3: {
    theme: 'Heritage and tourism',
    questions: [
      'Why do many people enjoy visiting historic places?',
      'What can people learn from visiting places with a long history?',
      'Do you think governments should spend public money on looking after old buildings?',
      'How has tourism changed the way historic places are looked after?',
      'Should countries limit the number of visitors to protect their historic sites, even if this reduces tourism income?',
    ],
  },
},
{
  id: 3,
  part1: [
    { topic: 'Home', questions: [
      'Do you live in a house or a flat?',
      'Which room in your home do you spend the most time in?',
      'Do you prefer spending your free time at home or going out?',
      'What would you change about your home if you could?',
    ] },
    { topic: 'Hobbies', questions: [
      'What hobbies do you have in your free time?',
      'How did you first become interested in your favourite hobby?',
      'Do you prefer hobbies that you do alone, or ones that involve other people?',
      'Do you think it is important for people to have a hobby?',
    ] },
    { topic: 'Sleep', questions: [
      'How many hours do you usually sleep each night?',
      'Do you find it easy to fall asleep at night?',
      'What do you usually do just before you go to bed?',
      'Does noise or light ever stop you from sleeping?',
    ] },
  ],
  part2: {
    prompt: 'Describe a piece of technology you find useful.',
    bullets: [
      'what this piece of technology is',
      'when you started using it and where you got it',
      'how you use it in your everyday life',
      'and explain why you find it so useful',
    ],
  },
  part3: {
    theme: 'Technology and daily life',
    questions: [
      'What kinds of technology do most people use every day?',
      'Do you think technology has made everyday life easier, or has it created new problems?',
      'Why do some people find it hard to switch off from their phones?',
      'How has technology changed the way families spend time together?',
      'Should schools focus more on teaching pupils to use technology, or on traditional skills such as handwriting?',
    ],
  },
},
{
  id: 4,
  part1: [
    { topic: 'Hometown', questions: [
      'How long have you lived in your hometown?',
      'Is your hometown a big city, a small town or a village?',
      'Where is the best place to go for a walk in your hometown?',
      'Do you think you will still be living there in ten years?',
    ] },
    { topic: 'Colours', questions: [
      'What is your favourite colour?',
      'Do you think colours can affect how people feel?',
      'Do you tend to wear bright colours, or do you prefer darker ones?',
      'Is there a colour that you really dislike?',
    ] },
    { topic: 'Birthdays', questions: [
      'How do you usually celebrate your birthday?',
      'What was your best birthday when you were a child?',
      'Do you prefer presents or spending time with friends on your birthday?',
      'Do people in your family make a big fuss about birthdays?',
    ] },
  ],
  part2: {
    prompt: 'Describe a time you helped someone.',
    bullets: [
      'who you helped and how you knew them',
      'when this happened and where you were',
      'what you did to help them',
      'and explain why helping them was important to you',
    ],
  },
  part3: {
    theme: 'Helping others and volunteering',
    questions: [
      'Why do people like to help others?',
      'Do you think children should be taught to help other people at school?',
      'What are the main benefits of volunteering for the people who do it?',
      'How has the way people help their communities changed over the last few decades?',
      'Should volunteers be paid for their work, or would that spoil the spirit of helping others?',
    ],
  },
},
{
  id: 5,
  part1: [
    { topic: 'Work or Study', questions: [
      'What do you do for a living, or what are you studying?',
      'How many hours a week do you spend working or studying?',
      'Which part of your job or studies do you find most challenging?',
      'Would you like to change your job or your field of study in the future?',
    ] },
    { topic: 'Flowers', questions: [
      'Do you like having flowers in your home?',
      'What is your favourite flower?',
      'Do you ever buy flowers for other people?',
      'Are there many flowers growing where you live?',
    ] },
    { topic: 'Photographs', questions: [
      'Do you take photographs very often?',
      'What do you usually take photographs of?',
      'Do you prefer taking photos on your phone or with a proper camera?',
      'Do you ever print your photographs, or do you keep them on your phone?',
    ] },
  ],
  part2: {
    prompt: 'Describe a book you enjoyed reading.',
    bullets: [
      'what the book was about and who wrote it',
      'when you read it and why you chose it',
      'how you felt while you were reading it',
      'and explain why you would or would not recommend it to others',
    ],
  },
  part3: {
    theme: 'Reading and literature',
    questions: [
      'Do you think people read as much as they used to?',
      'Why do some people prefer reading on screens to reading on paper?',
      'How has the way people access books changed over the last twenty years?',
      'What can reading fiction teach people about lives that are different from their own?',
      'Should schools put more emphasis on classic literature, or on modern books that young people enjoy reading?',
    ],
  },
},
);
