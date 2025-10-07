<script>
import CitizenToolbar from "../../toolbar/toolbarCitizen.component.vue";
import EditUser from "./user-edit-profile.page.vue";
import user from "primevue/menu";

export default {
  components: {
    CitizenToolbar,
    EditUser
  },
  props: {
    user: Object
  },
  data() {
    return {
      showPopup: false,
      showPassword: false
    };
  },
  computed: {
    fullName() {
      return `${this.user.name || ''} ${this.user.lastname || ''}`.trim();
    },
    maskedPassword() {
      console.log(user.profileImage)
      return this.showPassword ? this.user.password : '•'.repeat(this.user.password?.length || 8);
    }
  },
  methods: {
    openPopup() {
      this.showPopup = true;
    },
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    logout() {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      this.$router.push('/login');
    }
  }
};
</script>

<template>
  <div>
    <header>
      <CitizenToolbar />
    </header>
    <div class="padre">
      <div class="container">
        <div class="left">
          <img :src="user.profile_image" alt="Usuario" class="img" />

        </div>
        <div class="right">
          <h2>{{ fullName }}</h2>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>{{ $t('profile.user.phone') }}:</strong> {{ user.phonenumber }}</p>
          <p>
            <strong>{{ $t('profile.user.password') }}:</strong>
            {{ maskedPassword }}
            <button class="show-pass" @click="togglePassword">
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 1l22 22"></path>
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5.05 0-9.27-3.14-11-7 1.21-2.79 3.51-5.02 6.29-6.24"></path>
                <path d="M10.59 10.59a3 3 0 0 0 4.24 4.24"></path>
              </svg>

              <svg v-else xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>

          </p>

        </div>
        <div class="buttons">
          <button @click="openPopup">{{ $t('profile.edit') }}</button>
          <button @click="logout">{{ $t('profile.logout') }}</button>
        </div>
      </div>
    </div>

    <div class="popup-container" v-if="showPopup">
      <EditUser :user="user" @close="showPopup = false" />
    </div>
  </div>
</template>

<style scoped>
.popup-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.left img {
  width: 200px;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: 2px solid #ddd;
  object-fit: cover;
}

.padre {
  padding: 20vh 0 0 0;
  margin: 0 auto;
}
.show-pass {
  background: none;
  border: none;
  cursor: pointer;
  vertical-align: middle;
  padding: 0;
  margin-left: 10px;
}
.show-pass svg {
  vertical-align: middle;
}

button {
  background-color: #C4E2F3;
  color: #161616;
  font-weight: bolder;
  border: none;
  border-radius: 0.25em;
  padding: 0.5em 1em;
  margin: 0.5em;
  cursor: pointer;
  font-size: 20px;
  height: 45px;
  width: 30%;
}

button:hover {
  background-color: #A1B9C6;
}

.show-pass {
  background: none;
  border: none;
  padding: 0;
  margin-left: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
.show-pass svg {
  width: 20px;
  height: 20px;
}


.container {
  padding: 10px;
  border-radius: 24px;
  background-color: #55B0DB;
  width: 60vw;
  height: fit-content;
  display: flex;
  flex-wrap: wrap;
  text-align: center;
  margin: auto;
}

.left {
  align-items: center;
  padding: 3vh;
  margin: 0 auto;
}

.right {
  font-family: 'Montserrat', sans-serif;
  color: black;
  text-align: justify;
  font-weight: bold;
  font-size: 18px;
  padding: 3vh;
  flex: 1;
}

.buttons {
  flex: 100%;
  padding: 0 0 3vh 0;
}

@media (max-width: 1000px) {
  .padre {
    padding: 10vh 0 0 0;
  }
  .left {
    padding: 0;
  }
  button {
    width: 90%;
  }
  .container {
    width: 90vw;
    padding: 15px 0 0 0;
    display: inline-block;
  }
  .img {
    align-items: center;
    justify-items: center;
  }
  .popup-container {
    z-index: 1000;
  }
}
</style>
