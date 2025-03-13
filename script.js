// 쿠키 초기화 함수 (로그아웃 기능 포함)
function clearCookies() {
    document.cookie.split(";").forEach(function(c) {
        document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    clearCookies(); // 페이지 로드 시 쿠키 초기화 (로그아웃 효과)
    
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;

            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // 세션 쿠키 포함
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('로그인 성공!');
                    window.location.href = '/calendar';
                } else {
                    alert('사용자명 또는 비밀번호가 잘못되었습니다.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('로그인 중 오류가 발생했습니다.');
            });
        });
    }
    
    // 회원가입 버튼 클릭 시 회원가입 폼으로 변경
    var signupButton = document.getElementById('signupButton');
    if (signupButton) {
        signupButton.addEventListener('click', function() {
            document.getElementById('loginForm').innerHTML = `
                <label for="signupUsername">ID:</label>
                <input type="text" class="form-control" id="signupUsername" name="username" required><br>
                <label for="signupEmail">이메일:</label>
                <input type="email" class="form-control" id="signupEmail" name="email" required><br>
                <label for="signupPassword">비밀번호:</label>
                <input type="password" class="form-control" id="signupPassword" name="password" required><br>
                <button type="submit" class="btn btn-primary btn-lg btn-block">회원가입</button>
            `;
            
            var signupForm = document.getElementById('loginForm');
            signupForm.addEventListener('submit', function(event) {
                event.preventDefault();
                var formData = {
                    username: document.getElementById('signupUsername').value,
                    email: document.getElementById('signupEmail').value,
                    password: document.getElementById('signupPassword').value
                };
                
                fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('회원가입 성공!');
                        window.location.href = '/';
                    } else {
                        alert('회원가입 실패: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('회원가입 중 오류가 발생했습니다.');
                });
            });
        });
    }
});
