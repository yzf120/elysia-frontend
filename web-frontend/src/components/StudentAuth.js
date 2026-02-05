import { studentAPI } from '/services/index.js';

export class StudentAuth {
  constructor(container) {
    this.container = container;
    this.currentTab = 'password'; // password, sms, register
    this.countdown = 0;
    this.countdownTimer = null;
    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="auth-container">
        <div class="auth-header">
          <h1>🎓 Elysia 教育平台</h1>
          <p>学生登录</p>
        </div>
        
        <div class="auth-body">
          <div class="auth-tabs">
            <button class="tab-btn ${this.currentTab === 'password' ? 'active' : ''}" data-tab="password">
              密码登录
            </button>
            <button class="tab-btn ${this.currentTab === 'sms' ? 'active' : ''}" data-tab="sms">
              验证码登录
            </button>
            <button class="tab-btn ${this.currentTab === 'register' ? 'active' : ''}" data-tab="register">
              注册账号
            </button>
          </div>

          <div id="message-container"></div>

          ${this.renderForm()}
        </div>
      </div>
    `;
  }

  renderForm() {
    if (this.currentTab === 'password') {
      return `
        <form class="auth-form" id="auth-form">
          <div class="form-group">
            <label>学号</label>
            <input type="text" name="student_number" placeholder="请输入学号" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" name="password" placeholder="请输入密码" required />
          </div>
          <button type="submit" class="submit-btn">登录</button>
        </form>
      `;
    } else if (this.currentTab === 'sms') {
      return `
        <form class="auth-form" id="auth-form">
          <div class="form-group">
            <label>手机号</label>
            <input type="tel" name="phone_number" placeholder="请输入手机号" required maxlength="11" />
          </div>
          <div class="form-group">
            <label>验证码</label>
            <div class="code-input-group">
              <input type="text" name="code" placeholder="请输入验证码" required maxlength="6" />
              <button type="button" class="code-btn" id="send-code-btn">
                ${this.countdown > 0 ? `${this.countdown}秒后重试` : '获取验证码'}
              </button>
            </div>
          </div>
          <button type="submit" class="submit-btn">登录</button>
        </form>
      `;
    } else {
      return `
        <form class="auth-form" id="auth-form">
          <div class="form-group">
            <label>手机号</label>
            <input type="tel" name="phone_number" placeholder="请输入手机号" required maxlength="11" />
          </div>
          <div class="form-group">
            <label>学号</label>
            <input type="text" name="student_number" placeholder="请输入学号" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" name="password" placeholder="请设置密码（至少6位）" required minlength="6" />
          </div>
          <div class="form-group">
            <label>验证码</label>
            <div class="code-input-group">
              <input type="text" name="code" placeholder="请输入验证码" required maxlength="6" />
              <button type="button" class="code-btn" id="send-code-btn">
                ${this.countdown > 0 ? `${this.countdown}秒后重试` : '获取验证码'}
              </button>
            </div>
          </div>
          <button type="submit" class="submit-btn">注册</button>
        </form>
      `;
    }
  }

  attachEvents() {
    // 标签切换
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentTab = e.target.dataset.tab;
        this.render();
        this.attachEvents();
      });
    });

    // 发送验证码
    const sendCodeBtn = this.container.querySelector('#send-code-btn');
    if (sendCodeBtn) {
      sendCodeBtn.addEventListener('click', () => this.handleSendCode());
    }

    // 表单提交
    const form = this.container.querySelector('#auth-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(new FormData(form));
    });
  }

  async handleSendCode() {
    const phoneInput = this.container.querySelector('input[name="phone_number"]');
    const phoneNumber = phoneInput.value.trim();

    if (!phoneNumber || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      this.showMessage('请输入正确的手机号', 'error');
      return;
    }

    if (this.countdown > 0) return;

    try {
      const sendCodeBtn = this.container.querySelector('#send-code-btn');
      sendCodeBtn.disabled = true;

      if (this.currentTab === 'register') {
        await studentAPI.sendRegisterCode(phoneNumber);
      } else {
        await studentAPI.sendLoginCode(phoneNumber);
      }

      this.showMessage('验证码已发送', 'success');
      this.startCountdown();
    } catch (error) {
      this.showMessage(error, 'error');
      const sendCodeBtn = this.container.querySelector('#send-code-btn');
      sendCodeBtn.disabled = false;
    }
  }

  startCountdown() {
    this.countdown = 60;
    this.updateCountdownButton();

    this.countdownTimer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      this.updateCountdownButton();
    }, 1000);
  }

  updateCountdownButton() {
    const sendCodeBtn = this.container.querySelector('#send-code-btn');
    if (sendCodeBtn) {
      sendCodeBtn.textContent = this.countdown > 0 ? `${this.countdown}秒后重试` : '获取验证码';
      sendCodeBtn.disabled = this.countdown > 0;
    }
  }

  async handleSubmit(formData) {
    const submitBtn = this.container.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span>处理中...';

    try {
      let result;
      
      if (this.currentTab === 'password') {
        const studentNumber = formData.get('student_number');
        const password = formData.get('password');
        result = await studentAPI.loginWithPassword(studentNumber, password);
      } else if (this.currentTab === 'sms') {
        const phoneNumber = formData.get('phone_number');
        const code = formData.get('code');
        result = await studentAPI.loginWithSMS(phoneNumber, code);
      } else {
        const phoneNumber = formData.get('phone_number');
        const code = formData.get('code');
        const studentNumber = formData.get('student_number');
        const password = formData.get('password');
        result = await studentAPI.registerWithSMS(phoneNumber, code, studentNumber, password);
      }

      // 保存token和用户信息
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      if (result.user_info) {
        localStorage.setItem('userInfo', JSON.stringify(result.user_info));
        localStorage.setItem('userType', 'student');
      }

      this.showMessage(result.message || '操作成功', 'success');
      
      // 跳转到学生主页
      setTimeout(() => {
        window.location.href = '/student/dashboard.html';
      }, 1500);

    } catch (error) {
      this.showMessage(error, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = this.currentTab === 'register' ? '注册' : '登录';
    }
  }

  showMessage(message, type = 'error') {
    const container = this.container.querySelector('#message-container');
    container.innerHTML = `
      <div class="${type}-message">
        ${message}
      </div>
    `;
    
    setTimeout(() => {
      container.innerHTML = '';
    }, 3000);
  }

  destroy() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }
}
