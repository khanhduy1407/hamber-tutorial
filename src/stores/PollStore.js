import { writable } from "hamber/store";

const PollStore = writable([
  {
    id: 1,
    question: "What is your favorite programming language?",
    answerA: "JavaScript",
    answerB: "Python",
    votesA: 5,
    votesB: 3,
  },
]);

export default PollStore;
