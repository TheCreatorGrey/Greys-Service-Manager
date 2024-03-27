const params = new URLSearchParams(window.location.search);

const appID = params.get('appid');

document.body.style.backgroundColor = params.get('bgc');

let secondaryColor = params.get('sc');
let textColor = params.get('tc');
let borderRadius = params.get('br');
let headerFont = params.get('hf');
for (e of ['usernameInput', 'passwordInput', 'logBtn', 'crBtn']) {
    let element = document.getElementById(e);
    element.style.backgroundColor = secondaryColor;
    element.style.color = textColor;
    element.style.borderRadius = borderRadius;
}

const textHeader = document.getElementById('textHeader');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const indicator = document.getElementById('indicator');

textHeader.style.color = textColor;
textHeader.style.fontFamily = headerFont;

let service = new ServiceConnection();

function switchMenu(mode) {
    usernameInput.value = '';
    passwordInput.value = '';

    if (mode === 'login') {
        textHeader.innerText = 'Log in';
        document.getElementById('logBtn').innerText = 'Log in';
        document.getElementById('crBtn').innerText = 'Create account';

        document.getElementById('crBtn').onclick = function () { switchMenu('create') };
        document.getElementById('logBtn').onclick = async function () {
            indicator.innerText = '';

            result = await service.requestSession(
                usernameInput.value,
                passwordInput.value,
            )

            if (result) {
                window.top.postMessage(JSON.stringify({ ID: result, user: usernameInput.value }), '*')
                indicator.style.color = 'green';
                indicator.innerText = 'Login successful. You should be redirected shortly...';
            } else {
                indicator.innerText = 'Login failed. Please make sure login info is correct.';
            }
        }
    } else {
        textHeader.innerText = 'Sign up';
        document.getElementById('logBtn').innerText = 'Create account';
        document.getElementById('crBtn').innerText = 'Back';

        document.getElementById('crBtn').onclick = function () { switchMenu('login') };
        document.getElementById('logBtn').onclick = async function () {
            await service.register(
                usernameInput.value,
                passwordInput.value
            );

            switchMenu('login')
        };
    }
}

switchMenu('login');