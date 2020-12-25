const { create, Client } = require('@open-wa/wa-automate')
const welcome = require('./lib/welcome')
const left = require('./lib/left')
const cron = require('node-cron')
const color = require('./lib/color')
const fs = require('fs')
// const msgHndlr = require ('./icam')
const figlet = require('figlet')
const lolcatjs = require('lolcatjs')
const options = require('./options')

// AUTO UPDATE BY NURUTOMO
// THX FOR NURUTOMO
// Cache handler and check for file change
require('./icam.js')
nocache('./icam.js', module => console.log(`'${module}' Updated!`))
require('./lib/help.js')
nocache('./lib/help.js', module => console.log(`'${module}' Updated!`))
require('./lib/database/setting.json')
nocache('./lib/database/setting.json', module => console.log(`'${module}' Updated!`))

const adminNumber = JSON.parse(fs.readFileSync('./lib/database/admin.json'))
const setting = JSON.parse(fs.readFileSync('./lib/database/setting.json'))
const isWhite = (chatId) => adminNumber.includes(chatId) ? true : false

let { 
    limitCount,
    memberLimit, 
    groupLimit,
    mtc: mtcState,
    banChats,
    restartState: isRestart
    } = setting

function restartAwal(icam){
    setting.restartState = false
    isRestart = false
    icam.sendText(setting.restartId, 'Restart Succesfull!')
    setting.restartId = 'undefined'
    //fs.writeFileSync('./lib/setting.json', JSON.stringify(setting, null,2));
}

lolcatjs.options.seed = Math.round(Math.random() * 1000);
lolcatjs.options.colors = true;

const start = async (icam = new Client()) => {
        console.log('-------------------------------------------------------------------')
        lolcatjs.fromString(color(figlet.textSync('ICAM BOT', { horizontalLayout: 'full' })))
        console.log('-------------------------------------------------------------------')
        lolcatjs.fromString('[DEV] MR.CRACKED')
        lolcatjs.fromString('[SERVER] Server Started!')
        icam.onAnyMessage((fn) => messageLog(fn.fromMe, fn.type))
        // Force it to keep the current session
        icam.onStateChanged((state) => {
            console.log('[Client State]', state)
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') icam.forceRefocus()
        })
        // listening on message
        icam.onMessage((async (message) => {

        icam.getAmountOfLoadedMessages() // Cut message Cache if cache more than 3K
            .then((msg) => {
                if (msg >= 1000) {
                    console.log('[CLIENT]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    icam.cutMsgCache()
                }
            })
        // msgHndlr(icam, message)
        // Message Handler (Loaded from recent cache)
        require('./icam.js')(icam, message)
    }))
           

        icam.onGlobalParicipantsChanged((async (heuh) => {
            await welcome(icam, heuh) 
            left(icam, heuh)
            }))
        
        icam.onAddedToGroup(async (chat) => {
            if(isWhite(chat.id)) return icam.sendText(chat.id, 'Halo aku Icam, Ketik #help Untuk Melihat List Command Ku...')
            if(mtcState === false){
                const groups = await icam.getAllGroups()
                // BOT group count less than
                if(groups.length > groupLimit){
                    await icam.sendText(chat.id, 'Maaf, Batas group yang dapat Icam tampung sudah penuh').then(async () =>{
                        icam.deleteChat(chat.id)
                        icam.leaveGroup(chat.id)
                    })
                }else{
                    if(chat.groupMetadata.participants.length < memberLimit){
                        await icam.sendText(chat.id, `Maaf, BOT keluar jika member group tidak melebihi ${memberLimit} orang`).then(async () =>{
                            icam.deleteChat(chat.id)
                            icam.leaveGroup(chat.id)
                        })
                    }else{
                        if(!chat.isReadOnly) icam.sendText(chat.id, 'Halo aku Icam, Ketik #help Untuk Melihat List Command Ku...')
                    }
                }
            }else{
                await icam.sendText(chat.id, 'Icam sedang maintenance, coba lain hari').then(async () => {
                    icam.deleteChat(chat.id)
                    icam.leaveGroup(chat.id)
                })
            }
        })

        /*icam.onAck((x => {
            const { from, to, ack } = x
            if (x !== 3) icam.sendSeen(to)
        }))*/

        // listening on Incoming Call
        icam.onIncomingCall(( async (call) => {
            await icam.sendText(call.peerJid, 'Maaf, saya tidak bisa menerima panggilan. nelfon = block!.\nJika ingin membuka block harap chat Owner!')
            .then(() => icam.contactBlock(call.peerJid))
        }))
    }

/**
 * Uncache if there is file change
 * @param {string} module Module name or path
 * @param {function} cb <optional> 
 */
function nocache(module, cb = () => { }) {
    console.log('Module', `'${module}'`, 'is now being watched for changes')
    fs.watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })
}

/**
 * Uncache a module
 * @param {string} module Module name or path
 */
function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

create(options(true, start))
    .then(icam => start(icam))
    .catch((error) => console.log(error))
