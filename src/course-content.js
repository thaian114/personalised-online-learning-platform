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
