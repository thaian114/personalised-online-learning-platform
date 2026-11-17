// Original English teaching material for the first interim demonstration.
// Keys include the course id because lesson numbers repeat across courses.
const question = (id, prompt, options, answer, explanation) => ({
  id,
  prompt,
  options,
  answer,
  explanation,
});
export const interimLessons = {
  'foundations:1': {
    en: 'Greetings and introductions',
    sub: 'Hello. My name is Bao. Nice to meet you.',
    objectives: [
      'Introduce yourself using I am and My name is.',
      'Choose a greeting for a familiar or formal situation.',
    ],
    body: 'Use Hello in both formal and informal situations. Hi is informal. Introduce your name with My name is or I am. The contraction of I am is I\u2019m. Ask What is your name? and respond politely with Nice to meet you. Use Good morning before noon.',
    examples: [
      'Hello, my name is Bao.',
      'Hi, I am Anna. What is your name?',
      'Nice to meet you, Anna.',
    ],
    practice:
      'Write a four-line conversation between two students meeting for the first time. Include a greeting, two names and a polite closing.',
    summary: 'Greet your partner, introduce your name and respond politely.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question(
        'f1-1',
        'Choose the correct introduction.',
        ['My name are Bao.', 'My name is Bao.', 'My name am Bao.', 'My name be Bao.'],
        1,
        'Name is singular, so use is.',
      ),
      question(
        'f1-2',
        'Which greeting is informal?',
        ['Good evening.', 'Good morning.', 'Hi!', 'Good afternoon.'],
        2,
        'Hi is an informal greeting.',
      ),
      question(
        'f1-3',
        'Someone says Nice to meet you. Choose a polite response.',
        ['Nice to meet you too.', 'What time?', 'No name.', 'Where time?'],
        0,
        'Return the polite greeting with too.',
      ),
    ],
  },
  'foundations:2': {
    en: 'Nouns and pronouns',
    sub: 'Anna is a student. She studies English.',
    objectives: [
      'Replace repeated nouns with subject pronouns.',
      'Distinguish singular and plural subjects.',
    ],
    body: 'A noun names a person, place or thing. A subject pronoun replaces a noun before a verb. Use he for one male person, she for one female person, it for one thing and they for plural nouns. Use we when the speaker belongs to the group and I when speaking about yourself.',
    examples: [
      'Anna is a student. She studies English.',
      'The books are new. They are on the desk.',
      'Bao and I are friends. We study together.',
    ],
    practice:
      'Rewrite these subjects using pronouns: Anna, the book, Bao and I, the students. Write one complete sentence with each pronoun.',
    summary: 'Subject pronouns avoid repeated nouns and agree with the number of the subject.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question(
        'f2-1',
        'Anna is a teacher. ___ works here.',
        ['They', 'It', 'She', 'We'],
        2,
        'She replaces Anna.',
      ),
      question(
        'f2-2',
        'Bao and I are students. ___ study English.',
        ['We', 'He', 'It', 'She'],
        0,
        'Use we for a group including the speaker.',
      ),
      question(
        'f2-3',
        'The books are new. ___ are on the desk.',
        ['He', 'She', 'It', 'They'],
        3,
        'Books is plural, so use they.',
      ),
    ],
  },
  'foundations:3': {
    en: 'The verb to be',
    sub: 'I am. You are. She is.',
    objectives: [
      'Match am, is and are with their subjects.',
      'Make negative statements and yes/no questions with be.',
    ],
    body: 'Use am with I, is with he, she and it, and are with you, we and they. To make a negative statement, put not after be. To ask a yes/no question, put be before the subject. Answer with a short response such as Yes, I am or No, she is not.',
    examples: ['I am a student.', 'She is not tired.', 'Are you ready? Yes, I am.'],
    practice:
      'Write one affirmative sentence, one negative sentence and one question about a classmate using the verb be.',
    summary:
      'Choose am, is or are, add not for negatives and invert be and the subject for questions.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question('f3-1', 'I ___ ready.', ['is', 'are', 'be', 'am'], 3, 'I takes am.'),
      question(
        'f3-2',
        'Choose the correct negative.',
        ['She not is tired.', 'She is not tired.', 'She are not tired.', 'She am not tired.'],
        1,
        'Put not after is.',
      ),
      question(
        'f3-3',
        'Choose the correct question.',
        ['You are ready?', 'Are you ready?', 'Is you ready?', 'Am you ready?'],
        1,
        'Put are before you to form the question.',
      ),
    ],
  },
  'foundations:4': {
    en: 'Present simple',
    sub: 'I study every day. She studies on Monday.',
    objectives: [
      'Use the present simple for routines and facts.',
      'Add s or es to verbs with he, she and it.',
    ],
    body: 'Use the present simple for repeated activities, habits and facts. With I, you, we and they, use the base form of the verb. With he, she or it, usually add s. Add es after verbs ending in sh, ch, ss, x or o. Change a consonant plus y to ies, as in study and studies.',
    examples: [
      'I walk to class every morning.',
      'She watches an English video after dinner.',
      'Bao studies vocabulary on the bus.',
    ],
    practice:
      'Write five sentences about weekly routines. Use two subjects from I, you, we or they and three subjects from he, she or it.',
    summary:
      'Use the base verb with I, you, we and they, and the s or es form with he, she and it.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question(
        'f4-1',
        'She ___ English every evening.',
        ['study', 'studies', 'studying', 'to study'],
        1,
        'Study changes to studies with she.',
      ),
      question(
        'f4-2',
        'Choose the sentence about a routine.',
        ['I study on Mondays.', 'I am studying now.', 'I studied yesterday.', 'I will study later.'],
        0,
        'A repeated Monday activity uses the present simple.',
      ),
      question(
        'f4-3',
        'My brother ___ to school by bus.',
        ['go', 'goes', 'going', 'gone'],
        1,
        'Go takes es with the singular subject my brother.',
      ),
    ],
  },
  'foundations:5': {
    en: 'Present simple negatives and questions',
    sub: 'I do not work here. Does she study English?',
    objectives: [
      'Form present simple negatives with do not and does not.',
      'Ask and answer present simple yes/no questions.',
    ],
    body: 'Use do not or do not contracted to don\'t with I, you, we and they. Use does not or doesn\'t with he, she and it. After do, does, don\'t or doesn\'t, use the base form of the main verb. Put do or does before the subject to make a yes/no question.',
    examples: [
      'I do not drink coffee in the evening.',
      'She does not walk to university.',
      'Does he study on Saturday? Yes, he does.',
    ],
    practice:
      'Change two affirmative routine sentences into negatives. Then write two yes/no questions and give short answers.',
    summary:
      'Use do or does for questions and add not for negatives; keep the main verb in its base form.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question(
        'f5-1',
        'Choose the correct negative.',
        ['She not likes tea.', 'She does not like tea.', 'She do not likes tea.', 'She does not likes tea.'],
        1,
        'Use does not and the base verb like.',
      ),
      question(
        'f5-2',
        '___ they study together?',
        ['Does', 'Are', 'Do', 'Is'],
        2,
        'Use do with the plural subject they.',
      ),
      question(
        'f5-3',
        'Does Minh work here?',
        ['Yes, he work.', 'Yes, he is.', 'Yes, he does.', 'Yes, he do.'],
        2,
        'A short answer to a does question uses does.',
      ),
    ],
  },
  'foundations:6': {
    en: 'Adverbs of frequency',
    sub: 'I usually review vocabulary after class.',
    objectives: [
      'Use common adverbs to describe how often activities happen.',
      'Place frequency adverbs correctly with be and other verbs.',
    ],
    body: 'Adverbs of frequency include always, usually, often, sometimes, rarely and never. Put them before most main verbs, but after the verb be. Use expressions such as every day, once a week and twice a month at the beginning or end of a sentence. Never already has a negative meaning.',
    examples: [
      'I usually review my notes after class.',
      'She is often early for the lesson.',
      'We practise speaking twice a week.',
    ],
    practice:
      'Create a weekly study survey with four activities. Answer it using four different frequency adverbs or expressions.',
    summary:
      'Place frequency adverbs before main verbs but after be, and use time expressions to add detail.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question(
        'f6-1',
        'Choose the correct word order.',
        ['I study usually at night.', 'I usually study at night.', 'Usually I at night study.', 'I at night usually study.'],
        1,
        'Usually comes before the main verb study.',
      ),
      question(
        'f6-2',
        'She ___ late for class.',
        ['is never', 'never is', 'does never', 'never does'],
        0,
        'With be, put never after is.',
      ),
      question(
        'f6-3',
        'Which expression means two times each week?',
        ['Every two week', 'Twice a week', 'Second week', 'Two weekly time'],
        1,
        'Twice a week means two times each week.',
      ),
    ],
  },
  'foundations:7': {
    en: 'Prepositions of time',
    sub: 'At seven, on Monday, in November.',
    objectives: [
      'Choose at, on and in for common time expressions.',
      'Describe a study schedule with dates and times.',
    ],
    body: 'Use at with exact clock times and fixed points such as noon or night. Use on with days and dates. Use in with months, years, seasons and longer periods, and with parts of the day such as the morning. Do not use at, on or in before this, next, last or every.',
    examples: [
      'The lesson starts at 8:30.',
      'We have a quiz on Friday.',
      'The course finishes in December.',
    ],
    practice:
      'Write a five-line study schedule containing two clock times, two days or dates and one month. Check every preposition.',
    summary:
      'Use at for precise times, on for days and dates, and in for months, years and longer periods.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question('f7-1', 'The class begins ___ nine.', ['in', 'on', 'at', 'from'], 2, 'Use at with an exact clock time.'),
      question('f7-2', 'We study together ___ Tuesday.', ['at', 'on', 'in', 'to'], 1, 'Use on with a day of the week.'),
      question('f7-3', 'My exam is ___ December.', ['on', 'at', 'in', 'by'], 2, 'Use in with a month.'),
    ],
  },
  'foundations:8': {
    en: 'Present continuous',
    sub: 'They are studying now.',
    objectives: [
      'Describe actions happening now with be plus an ing form.',
      'Distinguish a current action from a regular routine.',
    ],
    body: 'Form the present continuous with am, is or are followed by a verb ending in ing. Use it for an action happening now or around the present time. Add not after be for a negative, and move be before the subject for a question. Use the present simple instead for regular routines.',
    examples: [
      'I am reading the lesson now.',
      'They are not using their phones.',
      'Is she writing an answer? Yes, she is.',
    ],
    practice:
      'Look around your study area and write four sentences about actions happening now. Add one negative and one question.',
    summary:
      'Use am, is or are plus an ing verb for actions in progress, not for ordinary routines.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question('f8-1', 'We ___ English now.', ['study', 'are studying', 'studies', 'studied'], 1, 'Now signals the present continuous are studying.'),
      question('f8-2', 'Choose the correct negative.', ['He not listening.', 'He is not listening.', 'He does not listening.', 'He are not listening.'], 1, 'Put not after is and use listening.'),
      question('f8-3', 'Which sentence describes a routine?', ['She is walking now.', 'She walks every morning.', 'She is opening the door.', 'She is talking now.'], 1, 'Every morning describes a repeated routine.'),
    ],
  },
  'foundations:9': {
    en: 'Past simple',
    sub: 'We visited the library yesterday.',
    objectives: [
      'Use regular and common irregular past simple forms.',
      'Form past simple negatives and questions with did.',
    ],
    body: 'Use the past simple for a completed action at a finished past time. Regular verbs usually add ed, while irregular verbs have special forms such as go and went or have and had. Use did not plus the base verb for negatives. Put did before the subject for questions.',
    examples: [
      'I watched an English video yesterday.',
      'She went to the library after class.',
      'Did you finish the exercise? No, I did not.',
    ],
    practice:
      'Write five sentences about yesterday using three regular verbs and two irregular verbs. Turn one sentence into a question.',
    summary:
      'Use past forms for completed actions, but return to the base verb after did or did not.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question('f9-1', 'Yesterday, we ___ the lesson.', ['finish', 'finished', 'finishes', 'finishing'], 1, 'The finished past time yesterday requires finished.'),
      question('f9-2', 'She ___ to the library last night.', ['go', 'goed', 'went', 'going'], 2, 'Went is the irregular past form of go.'),
      question('f9-3', 'Choose the correct question.', ['Did you studied?', 'Do you studied?', 'Did you study?', 'Were you study?'], 2, 'Use did followed by the base verb study.'),
    ],
  },
  'foundations:10': {
    en: 'Everyday vocabulary',
    sub: 'People, places and useful actions.',
    objectives: [
      'Group everyday words by person, place, object and action.',
      'Use context to choose an appropriate everyday word.',
    ],
    body: 'Learn vocabulary in meaningful groups rather than as isolated translations. Connect a place with people, objects and actions that commonly appear there. For example, at a library you may meet a librarian, borrow a book and use a shelf. Record a short example sentence with every new word.',
    examples: [
      'A cashier helps customers in a shop.',
      'I borrow a book from the library.',
      'Please put the cup on the kitchen table.',
    ],
    practice:
      'Choose home, university and a shop. For each place, list two people or objects and two actions, then write one sentence.',
    summary:
      'Organise vocabulary by situation and learn each word inside a clear example sentence.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question('f10-1', 'Where do you usually borrow a book?', ['A library', 'A bakery', 'A station', 'A pharmacy'], 0, 'Libraries lend books to readers.'),
      question('f10-2', 'Who usually takes payment in a shop?', ['A passenger', 'A cashier', 'A neighbour', 'A driver'], 1, 'A cashier receives customers payments.'),
      question('f10-3', 'Choose the natural phrase.', ['drink a chair', 'borrow a book', 'read a kitchen', 'open a student'], 1, 'Borrow a book is a natural verb and noun combination.'),
    ],
  },
  'foundations:11': {
    en: 'Integrated practice',
    sub: 'Combine grammar, vocabulary and time expressions.',
    objectives: [
      'Combine several course grammar points in one short text.',
      'Check subject–verb agreement, tense and word order.',
    ],
    body: 'Good communication combines grammar and vocabulary rather than practising one rule at a time. First identify the time: a routine, an action now or a completed past event. Then check the subject and verb form. Finally read the complete sentence for meaning, word order and an appropriate time expression.',
    examples: [
      'I usually study at eight, but tonight I am studying at nine.',
      'Lan goes to class on Monday and visited the library yesterday.',
      'Does Bao practise every day? Yes, he does.',
    ],
    practice:
      'Write a six-sentence learning diary: two routine sentences, two actions happening now and two completed actions from yesterday.',
    summary:
      'Choose the tense from the meaning, match the verb to its subject and check the full sentence.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question('f11-1', 'I usually ___ at eight, but I ___ now.', ['study / am studying', 'studies / study', 'studied / study', 'am studying / studies'], 0, 'A routine uses study; an action now uses am studying.'),
      question('f11-2', 'Choose the correct sentence.', ['She go on Monday.', 'She goes on Monday.', 'She going at Monday.', 'She does goes Monday.'], 1, 'She takes goes, and a day takes on.'),
      question('f11-3', 'Which sentence is in the past?', ['We practise every day.', 'We are practising now.', 'We practised yesterday.', 'We usually practise.'], 2, 'Practised and yesterday mark a completed past action.'),
    ],
  },
  'foundations:12': {
    en: 'Course review',
    sub: 'Review, practise and plan your next step.',
    objectives: [
      'Review the core grammar and vocabulary from this course.',
      'Identify one strong area and one area for further practice.',
    ],
    body: 'Review subject pronouns, the verb be, present simple forms, frequency adverbs, time prepositions, present continuous and past simple. Read each task for a time signal before choosing a tense. After checking your answers, record the rule behind every correction and choose one topic to practise again.',
    examples: [
      'She usually studies in the evening.',
      'They are completing the final review now.',
      'Did you practise yesterday? Yes, I did.',
    ],
    practice:
      'Write a short learner profile with two routines, one current action and one past action. Underline the time signal in each sentence.',
    summary:
      'Use meaning and time signals to select a form, then explain corrections instead of only counting answers.',
    worksheet: '/materials/foundations-worksheet.html',
    questions: [
      question('f12-1', 'My friend ___ English every day.', ['study', 'studies', 'is study', 'studied now'], 1, 'A routine with the singular subject my friend takes studies.'),
      question('f12-2', 'They ___ the review at the moment.', ['complete', 'completed', 'are completing', 'completes'], 2, 'At the moment signals the present continuous.'),
      question('f12-3', '___ you visit the library yesterday?', ['Do', 'Are', 'Did', 'Does'], 2, 'A past simple question begins with did.'),
    ],
  },
  'everyday:1': {
    en: 'Saying hello',
    sub: 'Start and finish a friendly conversation.',
    objectives: ['Open a short conversation politely.', 'Use a suitable closing expression.'],
    body: 'Start with Hello or Hi and ask How are you? A short answer is enough: I am fine, thanks. And you? In a conversation with a new classmate, speak clearly and listen before answering. To leave politely, say It was nice talking to you or See you later.',
    examples: [
      'Hi, how are you?',
      'I am fine, thanks. And you?',
      'It was nice talking to you. See you later.',
    ],
    practice:
      'Role-play a meeting with a classmate before a lesson. Greet them, ask how they are and end the conversation politely.',
    summary: 'Open with a greeting, respond to your partner and use a polite closing.',
    worksheet: '/materials/everyday-worksheet.html',
    questions: [
      question(
        'e1-1',
        'Choose a natural answer to How are you?',
        ['At seven.', 'Fine, thanks.', 'Two books.', 'On Monday.'],
        1,
        'Fine, thanks describes how you feel.',
      ),
      question(
        'e1-2',
        'Which expression ends a conversation?',
        ['What is your name?', 'Hello!', 'See you later.', 'How are you?'],
        2,
        'See you later is a friendly closing.',
      ),
      question(
        'e1-3',
        'You say I am fine, thanks. What can you add?',
        ['And you?', 'How many book?', 'At where?', 'Who time?'],
        0,
        'And you returns the question politely.',
      ),
    ],
  },
  'everyday:2': {
    en: 'Introducing yourself',
    sub: 'Share your name, hometown and interests.',
    objectives: [
      'Give three pieces of personal information.',
      'Ask a follow-up question politely.',
    ],
    body: 'After saying your name, share your hometown with I am from and an interest with I like. Ask Where are you from? to learn about your partner. You can ask What do you like doing? Listen to the answer and find something you have in common. Share only information you feel comfortable sharing.',
    examples: [
      'My name is Bao. I am from Ho Chi Minh City.',
      'I like reading and playing football.',
      'Where are you from? What do you like doing?',
    ],
    practice:
      'Write a 40-word introduction with a name, hometown and hobby. Then write two questions for a new classmate.',
    summary:
      'Use I am from for hometowns and I like for interests, then invite your partner to speak.',
    worksheet: '/materials/everyday-worksheet.html',
    questions: [
      question(
        'e2-1',
        'Choose the correct phrase.',
        ['I from Hanoi.', 'I am from Hanoi.', 'I is from Hanoi.', 'I are Hanoi.'],
        1,
        'Use I am from before a place.',
      ),
      question(
        'e2-2',
        'Which question asks about a hometown?',
        ['How old is the book?', 'What time is it?', 'Where are you from?', 'How much is it?'],
        2,
        'Where are you from asks about your place of origin.',
      ),
      question(
        'e2-3',
        'Choose a sentence about an interest.',
        ['I like reading.', 'I am from Hue.', 'My name is Anna.', 'It is Monday.'],
        0,
        'I like reading expresses an interest.',
      ),
    ],
  },
  'everyday:3': {
    en: 'Talking about your day',
    sub: 'I get up at seven. She studies in the evening.',
    objectives: [
      'Describe a daily routine with the present simple.',
      'Use at with clock times and ask about routines.',
    ],
    body: 'Use the present simple for regular activities. With I, you, we and they, use the base verb. With he or she, usually add s or es. Use at before a clock time. Ask about a routine with What time do you...? Use first, then and finally to put activities in order.',
    examples: [
      'I get up at seven.',
      'She studies English in the evening.',
      'What time do you have breakfast?',
    ],
    practice:
      'Describe your morning in five sentences. Include two clock times and use first, then and finally to show the order.',
    summary:
      'Describe repeated activities using the present simple and at with specific clock times.',
    worksheet: '/materials/everyday-worksheet.html',
    questions: [
      question(
        'e3-1',
        'She ___ English every evening.',
        ['study', 'studies', 'studying', 'to study'],
        1,
        'With she, change study to studies.',
      ),
      question(
        'e3-2',
        'I have breakfast ___ seven.',
        ['on', 'in', 'at', 'to'],
        2,
        'Use at before a clock time.',
      ),
      question(
        'e3-3',
        'Choose the correct question.',
        [
          'What time do you get up?',
          'What time does you get up?',
          'What time you gets up?',
          'What time are you get up?',
        ],
        0,
        'Use do with you and the base verb get.',
      ),
    ],
  },
};

export function getLessonContent(courseId, lessonId) {
  return interimLessons[`${courseId}:${lessonId}`] || null;
}
