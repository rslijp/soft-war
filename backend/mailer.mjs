import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const msg = {
    to: 'renzo.slijp@gmail.com', // Change to your recipient
    from: 'gamemaster@softcause.nl', // Change to your verified sender
    subject: 'Sending with SendGrid is Fun '+new Date(),
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}
export function sendTestMail() {
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        })
}

export function winnerEmail(email, name) {
    sgMail.send({
        to: email, // Change to your recipient
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'Congratulations, you won a SoftWar',
        text: 'Congratulations, you won the game {{name}}',
        html: 'Congratulations, you won the game <strong>{{name}}</strong>',
        substitutions: {name: name}
    });
}

export function lostEmail(emails, name) {
    sgMail.send({
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'Sorry, you lost a SoftWar',
        text: 'Sorry, you lost the game {{name}}',
        html: 'Sorry you lost the game <strong>{{name}}</strong>',
        substitutions: {name: name},
        personalizations: emails.map(to => {return {to: to}})
    });
}

export function pendingMail(email, name, pending){
    sgMail.send({
        to: email,
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'Nice you started a SoftWar',
        text: 'Nice you started a SoftWar {{name}}. We are still waiting for {{pending}} to accept the game.',
        html: 'Nice you started a SoftWar <strong>{{name}}</strong>. We are still waiting for <strong>{{pending}}</strong> to accept the game.',
        substitutions: {name: name, pending: pending.join(", ")}
    });
    sgMail.send({
        from: 'gamemaster@softcause.nl', // Change to your verified sender
        subject: 'You have been invited to play a game of SoftWar',
        text: 'Nice you have been invited to play a game of SoftWar {{name}} by {{email}}. Accept the game at https://game.softcause.com?',
        html: 'Nice you have been invited to play a game of SoftWar <strong>{{name}}</strong> by <strong>{{email}}</strong>. Accept the game at <a href="https://game.softcause.com">https://game.softcause.com</a>?',
        substitutions: {name: name, email: email},
        personalizations: pending.map(to => {return {to: to}})
    });
}