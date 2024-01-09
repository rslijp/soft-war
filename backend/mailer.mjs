import sgMail from '@sendgrid/mail';
import fs from 'fs';
const logoBase64 =  fs.readFileSync('./resources/logo.png', {encoding: 'base64'});

function decorateImage(msg){
    msg.attachments=[
        {
            filename:     'logo.png',
            contentType:  'image/png',
            cid:          'myimagecid',
            content_id:   'myimagecid',
            content:      logoBase64,
            disposition : "inline"
        }
    ];
    msg.text =msg.text='\n\nRegards,\nRenzo from SoftCause';
    msg.html = '<img src="cid:myimagecid" style="width:48px; height: 48px"/><br/>'+msg.html;
    msg.html = msg.html+ '<br/><br/>Regards, <br/>Renzo from SoftCause';
    return msg;
}


sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const msg = {
    to: 'renzo.slijp@gmail.com', // Change to your recipient
    from: 'gamemaster@softcause.nl', // Change to your verified sender
    subject: 'Sending boot mail in SendGrid '+new Date(),
    text: 'SoftWar back-end is booted.',
    html: '<strong>SoftWar</strong> back-end is booted.'
}
export function sendTestMail() {
    sgMail
        .send(decorateImage(msg))
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        })
}

export function winnerEmail(email, name) {
    sgMail.send(decorateImage({
        to: email, // Change to your recipient
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'Congratulations, you won a SoftWar',
        text: 'Congratulations, you won the game {{name}}',
        html: 'Congratulations, you won the game <strong>{{name}}</strong>',
        substitutions: {name: name}
    }));
}

export function lostEmail(emails, name) {
    sgMail.send(decorateImage({
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'Sorry, you lost a SoftWar',
        text: 'Sorry, you lost the game {{name}}',
        html: 'Sorry you lost the game <strong>{{name}}</strong>',
        substitutions: {name: name},
        personalizations: emails.map(to => {return {to: to}})
    }));
}

export function pendingMail(email, name, pending){
    sgMail.send(decorateImage({
        to: email,
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'Nice you started a SoftWar',
        text: 'Nice you started a SoftWar {{name}}. We are still waiting for {{pending}} to accept the game.',
        html: 'Nice you started a SoftWar <strong>{{name}}</strong>. We are still waiting for <strong>{{pending}}</strong> to accept the game.',
        substitutions: {name: name, pending: pending.join(", ")}
    }));
    sgMail.send(decorateImage({
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'You have been invited to play a game of SoftWar',
        text: 'Nice you have been invited to play a game of SoftWar {{name}} by {{email}}. Accept the game at https://game.softcause.com',
        html: 'Nice you have been invited to play a game of SoftWar <strong>{{name}}</strong> by <strong>{{email}}</strong>. Accept the game at <a href="https://game.softcause.com">https://game.softcause.com</a>',
        substitutions: {name: name, email: email},
        personalizations: pending.map(to => {return {to: to}})
    }));
}

export function allAccepted(name, players){
    sgMail.send(decorateImage({
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'All players accepted a game of SoftWar',
        text: 'Whoohooo all players accepted the game {{name}}. You can now play it game at https://game.softcause.com!',
        html: 'Whoohooo all players accepted the game <strong>{{name}}</strong>. You can now play it game at <a href="https://game.softcause.com">https://game.softcause.com</a>!',
        substitutions: {name: name},
        personalizations: players.map(to => {return {to: to}})
    }));
}

export function oneDeclined(name, players){
    sgMail.send(decorateImage({
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'One player declined a game of SoftWar',
        text: 'Sorry one player declined the offer to play a game of {{name}}. You reschedule a different game at https://game.softcause.com',
        html: 'Sorry one player declined the offer to play a game of <strong>{{name}}</strong>. You reschedule a different game at <a href="https://game.softcause.com">https://game.softcause.com</a>',
        substitutions: {name: name},
        personalizations: players.map(to => {return {to: to}})
    }));
}