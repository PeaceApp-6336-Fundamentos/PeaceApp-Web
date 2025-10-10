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

export default {
  props: {
    user: Object,
  },
  data() {
    return {
      name: this.user.name || '',
      lastname: this.user.lastname || '',
      email: this.user.email || '',
      phonenumber: this.user.phonenumber || '',
      profileImage: this.user.profileImage || '',
      userService: new UserApiService(),
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
      const phoneRegex = /^\d{9}$/;
      if (!phoneRegex.test(this.phonenumber)) {
        alert("Phone number must be exactly 9 digits.");
        return;
      }

      try {
        const profileUpdate = await this.userService.updateUser(this.user.id, {
          name: this.name,
          lastname: this.lastname,
          email: this.email,
          phonenumber: this.phonenumber,
          userId: this.user.userId,
          profileImage: this.profileImage
        });

        if (![200, 202].includes(profileUpdate.status)) {
          throw new Error('User profile update failed');
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
