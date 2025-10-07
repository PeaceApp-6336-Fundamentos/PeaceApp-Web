<template>
  <header>
    <CitizenToolbar />
  </header>
  <div class="container">
    <div class="search">
      <h1 class="title">{{ $t('map.find') }}</h1>
      <div class="destinationInput">
        <div class="subtitle"><h2>{{ $t('map.question') }}</h2></div>
        <div class="pv-inputgroup">
          <pv-inputtext class="input" v-model="endLocationInput" type="text" :placeholder="$t('map.placeholder')" />
          <button class="icon" @click="calculateRoute" :disabled="isLoading">
            <i class="pi" :class="{'pi-search': !isLoading, 'pi-spinner pi-spin': isLoading}" style="color: black"></i>
          </button>
        </div>
      </div>
      <div v-if="routeError" class="error-message">{{ routeError }}</div>
    </div>
    <div id="map">
      <div id="center-pin"></div>
    </div>
    <div id="sidebar" v-if="hasRoute">
      <h3>{{ $t('map.directions') }}</h3>
      <div class="route-info">
        <p><strong>{{ $t('map.distance') }}:</strong> {{ routeDistance }} km</p>
        <p><strong>{{ $t('map.duration') }}:</strong> {{ routeDuration }} min</p>
      </div>
      <div v-for="(instruction, index) in routeInstructions" :key="index" class="instruction">
        {{ instruction }}
      </div>
    </div>
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import CitizenToolbar from '../../toolbar/toolbarCitizen.component.vue';
import { LocationApiService } from '../../../services/locationapi.service.js';
import { ReportApiService } from '../../../services/reportapi.service.js';
import { AlertApiService } from '../../../services/alertapi.service.js';

import robTag from '@/assets/rob_tag.png';
import carTag from '@/assets/car_tag.png';
import illumTag from '@/assets/illumination_tag.png';
import acosoTag from '@/assets/acoso_tag.png';
import redMarker from '@/assets/red_marker.png';

export default {
  components: { CitizenToolbar },
  name: 'MapDirections',
  data() {
    return {
      map: null,
      endLocationInput: '',
      currentLocation: { lat: -12.0464, lng: -77.0428 },
      locationApi: new LocationApiService(),
      reportApi: new ReportApiService(),
      reportMap: {},
      markers: [],
      isLoading: false,
      routeError: null,
      hasRoute: false,
      routeDistance: 0,
      routeDuration: 0,
      routeInstructions: [],
      alertApi: new AlertApiService(),
      processedReports: new Set()
    };
  },
  mounted() {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    this.getCurrentLocation();
    this.deleteExistingAlerts();
    localStorage.setItem('alertsDeletedOnce', 'true');
  },
  watch: {
    '$i18n.locale'(newLocale) {
      this.updateAllPopups();
    }
  },
  methods: {
    async deleteExistingAlerts() {
      try {
        const response = await this.alertApi.deleteAll();
        console.log("All alerts deleted:", response.status);
      } catch (err) {
        console.error("Error deleting alerts on first load:", err);
      }
    },
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) *
          Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c * 1000;
    },
    async checkNearbyReports() {
      try {
        const [locRes, repRes] = await Promise.all([
          this.locationApi.getAll(),
          this.reportApi.getAll()
        ]);
        const locations = locRes.data;
        const reports = repRes.data;
        const userLat = this.currentLocation.lat;
        const userLng = this.currentLocation.lng;
        for (const loc of locations) {
          if (!loc || loc.alatitude === 0 || loc.alongitude === 0) continue;
          if (this.processedReports.has(loc.idReport)) continue;
          const dist = this.calculateDistance(userLat, userLng, loc.alatitude, loc.alongitude);
          if (dist <= 100) {
            const report = reports.find(r => r.id === loc.idReport);
            if (report) {
              await this.createAlert(report);
              this.processedReports.add(loc.idReport);
            }
          }
        }
      } catch (err) {
        console.error("Error in proximity check:", err);
      }
    },
    async createAlert(report) {
      const alertData = {
        location: report.address,
        type: report.type,
        description: report.detail,
        idUser: parseInt(localStorage.getItem("userId")),
        imageUrl: report.image,
        idReport: report.id
      };
      try {
        const existingAlerts = await this.alertApi.getByUserId(alertData.idUser);
        const alreadyExists = existingAlerts.data.some(alert =>
            alert.idReport === alertData.idReport &&
            alert.type === alertData.type &&
            alert.location === alertData.location
        );
        if (!alreadyExists) {
          await this.alertApi.create(alertData);
          console.log("Alert created:", alertData);
        }
      } catch (error) {
        console.error("Error creating alert:", error);
      }
    },
    translateType(type) {
      const types = {
        Robo: this.$t('reportForm.placeholders.robbery'),
        Accidente: this.$t('reportForm.placeholders.accident'),
        Oscuro: this.$t('reportForm.placeholders.dark_area'),
        Acoso: this.$t('reportForm.placeholders.harassment'),
        Otro: this.$t('reportForm.placeholders.other'),
        robbery: this.$t('reportForm.placeholders.robbery'),
        accident: this.$t('reportForm.placeholders.accident'),
        dark_area: this.$t('reportForm.placeholders.dark_area'),
        harassment: this.$t('reportForm.placeholders.harassment'),
        other: this.$t('reportForm.placeholders.other')
      };
      return types[type] || type;
    },
    async loadReportsAndMarkers() {
      try {
        const [locationRes, reportRes] = await Promise.all([
          this.locationApi.getAll(),
          this.reportApi.getAll()
        ]);
        const locations = locationRes.data;
        const reports = reportRes.data;
        this.clearAllMarkers();
        this.reportMap = {};
        reports.forEach(report => {
          this.reportMap[report.id] = report;
        });
        locations.forEach(loc => {
          const lat = parseFloat(loc.alatitude);
          const lng = parseFloat(loc.alongitude);
          if (isNaN(lat) || isNaN(lng)) return;
          const report = this.reportMap[loc.idReport];
          if (!report) return;
          this.createMarker(lng, lat, report);
        });
      } catch (error) {
        console.error("Error loading markers:", error);
      }
    },
    createMarker(lng, lat, report) {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      const typeToImage = {
        Robo: robTag,
        robbery: robTag,
        Accidente: carTag,
        accident: carTag,
        Oscuro: illumTag,
        dark_area: illumTag,
        Acoso: acosoTag,
        harassment: acosoTag,
        Otro: redMarker,
        other: redMarker
      };
      const imageUrl = typeToImage[report.type] || redMarker;
      el.style.backgroundImage = `url('${imageUrl}')`;
      el.style.width = '50px';
      el.style.height = '50px';
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.cursor = 'pointer';
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      }).setLngLat([lng, lat]);
      marker.setPopup(this.buildPopup(report));
      marker.addTo(this.map);
      this.markers.push({ marker, report, lng, lat });
    },
    buildPopup(report) {
      const translatedType = this.translateType(report.type);
      const popupHtml = `
        <div style="font-family: sans-serif; max-width: 250px; color: black;">
          <h4 style="margin: 0 0 8px; font-size: 16px; font-weight: bold;">${report.title}</h4>
          <p style="margin: 4px 0; font-size: 14px;"><strong>${this.$t('reports.type_label')}:</strong> ${translatedType}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>${this.$t('reports.address_label')}:</strong> ${report.address}</p>
          ${report.image ? `<img src="${report.image}" alt="Imagen del reporte" style="width: 100%; margin-top: 8px; border-radius: 4px;">` : ''}
        </div>
      `;
      return new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml);
    },
    updateAllPopups() {
      this.markers.forEach(({ marker, report }) => {
        marker.setPopup(this.buildPopup(report));
      });
    },
    clearAllMarkers() {
      this.markers.forEach(({ marker }) => marker.remove());
      this.markers = [];
    },
    async calculateRoute() {
      if (!this.endLocationInput) {
        this.routeError = this.$t('map.errors.enterDestination');
        return;
      }
      this.isLoading = true;
      this.routeError = null;
      try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(this.endLocationInput)}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();
        if (data.features.length > 0) {
          const location = data.features[0].center;
          this.map.flyTo({ center: location, zoom: 14 });
          this.currentLocation.lat = location[1];
          this.currentLocation.lng = location[0];
          localStorage.setItem("userLat", location[1]);
          localStorage.setItem("userLng", location[0]);
          this.hasRoute = true;
          await this.checkNearbyReports();
        } else {
          this.routeError = this.$t('map.errors.locationNotFound');
        }
      } catch (error) {
        console.error("Error while searching for location:", error);
        this.routeError = this.$t('map.errors.routeCalculationFailed');
      } finally {
        this.isLoading = false;
      }
    },
    clearRoute() {
      this.hasRoute = false;
      this.map.flyTo({
        center: [this.currentLocation.lng, this.currentLocation.lat],
        zoom: 14
      });
    },
    getCurrentLocation() {
      const storedLat = localStorage.getItem("userLat");
      const storedLng = localStorage.getItem("userLng");
      if (storedLat && storedLng) {
        this.currentLocation = {
          lat: parseFloat(storedLat),
          lng: parseFloat(storedLng)
        };
        this.initMap();
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
              this.currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              localStorage.setItem("userLat", this.currentLocation.lat);
              localStorage.setItem("userLng", this.currentLocation.lng);
              this.initMap();
            },
            () => this.initMap()
        );
      } else {
        this.initMap();
      }
    },
    initMap() {
      this.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [this.currentLocation.lng, this.currentLocation.lat],
        zoom: 14
      });
      this.map.on('load', () => {
        this.loadReportsAndMarkers();
        this.checkNearbyReports();
        this.map.resize();
      });
      this.map.on('moveend', async () => {
        const center = this.map.getCenter();
        this.currentLocation.lat = center.lat;
        this.currentLocation.lng = center.lng;
        localStorage.setItem("userLat", center.lat);
        localStorage.setItem("userLng", center.lng);
        await this.checkNearbyReports();
      });
      this.map.addControl(new mapboxgl.NavigationControl());
      this.map.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true
          })
      );
    }
  },
  beforeUnmount() {
    if (this.map) {
      this.map.remove();
    }
  }
};
</script>
<style>

.custom-marker {
  background-image: url('/src/assets/red_marker.png');
  background-size: contain;
  background-repeat: no-repeat;
  width: 50px;
  height: 50px;
  cursor: pointer;
  will-change: transform;
}

.mapboxgl-marker {
  transition: transform 0.2s;
}
</style>

<style scoped>
.container {
  padding: 100px 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

#map {
  height: 500px;
  width: 100%;
  margin-bottom: 20px;
  position: relative;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

#center-pin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  background-image: url('/src/assets/pin.png');
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 5;
  pointer-events: none;
}

.search {
  display: block;
  text-align: center;
  color: white;
  width: 100%;
  margin: 0 auto 20px;
}

.title {
  font-size: 36px;
  margin-bottom: 20px;
}

.subtitle h2 {
  font-size: 24px;
  margin-bottom: 20px;
}

.pv-inputgroup {
  display: flex;
  align-items: center;
  border: 2px solid #333;
  background-color: white;
  border-radius: 5px;
  width: 80%;
  max-width: 600px;
  margin: 0 auto 20px;
  overflow: hidden;
}

.input {
  border: none;
  padding: 12px;
  width: 90%;
  font-size: 16px;
  outline: none;
}

.icon {
  background-color: white;
  border: none;
  padding: 12px;
  width: 10%;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon:hover {
  background-color: #f0f0f0;
}

.icon:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.clear-route {
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.2s;
  font-size: 14px;
}

.clear-route:hover {
  background-color: #cc0000;
}

#sidebar {
  background-color: #f0f0f0;
  width: 100%;
  max-height: 300px;
  overflow: auto;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  color: #333;
}

#sidebar h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 18px;
}

.route-info {
  background-color: #e0e0e0;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  font-size: 14px;
}

.instruction {
  padding: 8px 0;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
}

.instruction:last-child {
  border-bottom: none;
}

.error-message {
  color: #ff4444;
  margin-top: 10px;
  background-color: rgba(255, 68, 68, 0.1);
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .container {
    padding-top: 80px;
  }

  #map {
    height: 400px;
  }

  .title {
    font-size: 28px;
  }

  .subtitle h2 {
    font-size: 20px;
  }

  .pv-inputgroup {
    width: 95%;
  }
}

@media (max-width: 480px) {
  #map {
    height: 300px;
  }

  .title {
    font-size: 24px;
  }

  .input {
    padding: 10px;
    font-size: 14px;
  }

  #sidebar {
    max-height: 200px;
  }
}
</style>