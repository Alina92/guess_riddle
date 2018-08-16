var BaseBot = require('bot-sdk');
var Datastore = require('nedb');
var _ = require('lodash');
var db2 = new Datastore({
    filename: 'db/riddle.db',
    autoload: true
});

class Bot extends BaseBot {
    constructor(postData) {
        super(postData);
        this.addLaunchHandler(() => {
            this.waitAnswer()
            return {
                outputSpeech: '大家一起猜猜猜! 进入游戏请说：开始游戏',
                reprompt: '进入游戏请说：开始游戏'
            };
        });
        //开始
        this.addIntentHandler('riddle_start', () => {
            var self = this
            var index = self.getSessionAttribute('index')
            var answer = this.getSlot('answer')
            if (answer) {
                var qs = self.getSessionAttribute('qs')
                var score = self.getSessionAttribute('score')
                var outputSpeech = ''
                var result = ''
                if (answer == qs[index].right) {
                    score++
                    self.setSessionAttribute('score', score)
                    result = `您的选择是${answer}，恭喜您答对了！`
                } else {
                    result = `您的选择是${answer}，抱歉您答错了！正确选项是${qs[index].right}. `
                }
                index++
                if (index < 3) {
                    self.setSessionAttribute('index', index)
                    outputSpeech = `<speak>${result}
                      请听下一题:${qs[index].q.question}猜是哪种植物？
                      a.${qs[index].a[0]}
                      b.${qs[index].a[1]}
                      c.${qs[index].a[2]}
                      abc您选哪一个？
                      `
                    this.nlu.ask('answer');
                    this.waitAnswer()
                    return {
                        outputSpeech: outputSpeech,
                        reprompt: 'abc您选哪一个？'
                    }
                } else {
                    outputSpeech = `<speak>${result},您在本轮总共答对了${score}个谜语!</speak>`
                    this.clearSessionAttribute()
                    this.endSession()
                    return {
                        outputSpeech: outputSpeech,
                    }
                }

            }
            function getRight(num) {
                var right = 'a'
                switch (num) {
                    case 0:
                        right = 'a'
                        break;
                    case 1:
                        right = 'b'
                        break;
                    case 2:
                        right = 'c'
                        break;
                    default:
                        break;
                }
                return right
            }
            this.nlu.ask('answer')
            this.waitAnswer()
            return new Promise(function (resolve, reject) {
                var i;
                db2.find({}, (err, docs) => {
                    docs = _.shuffle(docs)
                    var q1_a = _.shuffle([docs[0].answer, docs[docs.length - 1].answer, docs[docs.length - 2].answer])
                    var q1_right = getRight(_.indexOf(q1_a, docs[0].answer))
                    var q1 = {
                        q: docs[0],
                        a: q1_a,
                        right: q1_right
                    }
                    var q2_a = _.shuffle([docs[1].answer, docs[docs.length - 2].answer, docs[docs.length - 3].answer])
                    var q2_right = getRight(_.indexOf(q2_a, docs[1].answer))
                    var q2 = {
                        q: docs[1],
                        a: q2_a,
                        right: q2_right
                    }
                    var q3_a = _.shuffle([docs[2].answer, docs[docs.length - 5].answer, docs[docs.length - 6].answer])
                    var q3_right = getRight(_.indexOf(q3_a, docs[2].answer))
                    var q3 = {
                        q: docs[2],
                        a: q3_a,
                        right: q3_right
                    }
                    var qs = [q1, q2, q3]
                    self.setSessionAttribute('qs', qs)
                    self.setSessionAttribute('index', 0)
                    self.setSessionAttribute('score', 0)
                    resolve({
                        outputSpeech: `<speak>请听题:${q1.q.question}猜是哪种植物？
                            a.${q1.a[0]}
                            b.${q1.a[1]}
                            c.${q1.a[2]}
                            abc您选哪一个？</speak> `,
                        reprompt: 'abc您选哪一个？'
                    })
                })
            })
        })
    }
}

module.exports = Bot;