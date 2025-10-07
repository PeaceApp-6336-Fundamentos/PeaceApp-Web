<template>
  <div class="popup">
    <form @submit.prevent="updateProfile">
      <div class="flex">
        <div class="field">
          <label>{{ $t('userEdit.first_name') }}</label>
          <input class="input-style" type="text" v-model="name" required />
        </div>
        <div class="field">
          <label>{{ $t('userEdit.last_name') }}</label>
          <input class="input-style" type="text" v-model="lastname" required />
        </div>
      </div>
      <div class="flex">
        <div class="field">
          <label>{{ $t('userEdit.email') }}</label>
          <input class="input-style" type="email" v-model="email" required />
        </div>
        <div class="field">
          <label>{{ $t('userEdit.phone') }}</label>
          <input class="input-style" type="text" v-model="phonenumber" required />
        </div>
      </div>
      <div class="flex">
        <div class="field password-field">
          <label>{{ $t('userEdit.password') }}</label>
          <div class="password-container">
            <input :type="showPassword ? 'text' : 'password'" class="input-style" v-model="password" required />
            <button type="button" class="eye-button" @click="showPassword = !showPassword">
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
                <path d="M1 1l22 22" />
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5.05 0-9.27-3.14-11-7 1.21-2.79 3.51-5.02 6.29-6.24" />
                <path d="M10.59 10.59a3 3 0 0 0 4.24 4.24" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="flex">
        <div class="field">
          <label>{{ $t('userEdit.profileImage') }}</label>
          <input class="input-style" type="file" accept="image/*" @change="handleImageUpload" />
        </div>
      </div>
      <div class="image-container" v-if="profileImage">
        <img :src="profileImage" alt="Preview" class="preview-img" />
      </div>
      <div class="buttons">
        <button type="submit">Save Changes</button>
        <button type="button" @click="closePopup">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script>
import { UserApiService } from '../../../services/userapi.service.js';
import CloudinaryService from '../../../services/cloudinary.service.js';
import { authUserService } from '../../../services/authuser.service.js';

export default {
  props: {
    user: Object,
  },
  data() {
    return {
      name: this.user.name || '',
      lastname: this.user.lastname || '',
      email: this.user.email || '',
      password: this.user.password || '',
      phonenumber: this.user.phonenumber || '',
      profileImage: this.user.profile_image || '',
      showPassword: false,
      userService: new UserApiService(),
      authService: new authUserService()
    };
  },
  methods: {
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const { secure_url } = await CloudinaryService.uploadImage(file);
        this.profileImage = secure_url;
      } catch (error) {
        console.error('Image upload failed:', error);
        alert('Image upload failed.');
      }
    },

    async updateProfile() {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      const phoneRegex = /^\d{9}$/;

      if (!passwordRegex.test(this.password)) {
        alert("Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.");
        return;
      }

      if (!phoneRegex.test(this.phonenumber)) {
        alert("Phone number must be exactly 9 digits.");
        return;
      }

      try {
        const authResponse = await this.authService.changePassword({
          username: this.email,
          password: this.password
        });

        if (authResponse.status !== 202) {
          throw new Error('Auth password update failed');
        }

        const profileUpdate = await this.userService.updateUser(this.user.id, {
          name: this.name,
          lastname: this.lastname,
          email: this.email,
          phonenumber: this.phonenumber,
          profile_image: this.profileImage
        });

        if (![200, 202].includes(profileUpdate.status)) {
          throw new Error('User profile update failed');
        }

        const passwordUpdate = await this.userService.changeUserPassword(this.user.id, {
          password: this.password
        });

        if (![200, 202].includes(passwordUpdate.status)) {
          throw new Error('User password update failed');
        }

        this.closePopup();
        window.location.reload();
      } catch (error) {
        console.error('Update failed:', error);
        alert('Error updating profile.');
      }
    },

    closePopup() {
      this.$emit('close');
    }
  }
};

</script>

<style scoped>
.popup {
  background-color: #55B0DB;
  border-radius: 10px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  margin: auto;
}
.flex {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.field {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.input-style {
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #ccc;
}
.password-container {
  display: flex;
  align-items: center;
}
.eye-button {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 8px;
  padding: 0;
  display: flex;
  align-items: center;
}
.preview-img {
  width: 100px;
  height: 100px;
  margin-top: 10px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
.image-container {
  display: flex;
  justify-content: center;
}
.buttons {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
button {
  padding: 10px;
  flex: 1;
  border: none;
  border-radius: 5px;
  background-color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}
button:hover {
  background-color: #eee;
}
@media (max-width: 768px) {
  .popup {
    width: 95%;
    padding: 15px;
  }
  .flex {
    flex-direction: column;
  }
  .buttons {
    flex-direction: column;
  }
  .input-style,
  button {
    width: 100%;
  }
  .preview-img {
    width: 80px;
    height: 80px;
  }
}
</style>
