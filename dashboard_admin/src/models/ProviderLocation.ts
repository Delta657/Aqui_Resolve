export interface IProviderLocation {
  id: string;
  providerId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: 'online' | 'offline' | 'busy' | 'available';
  lastUpdate: Date;
  batteryLevel: number;
  signalStrength: number;
  currentService?: {
    id: string;
    title: string;
    clientName: string;
    estimatedTime: number;
    startTime: Date;
  };
  rating: number;
  vehicle?: {
    model: string;
    plate: string;
    color: string;
    year?: number;
  };
  deviceInfo: {
    platform: 'ios' | 'android';
    version: string;
    model: string;
    osVersion: string;
  };
  locationAccuracy: number; // em metros
  speed?: number; // em km/h
  heading?: number; // direção em graus
  altitude?: number; // altitude em metros
  isMoving: boolean;
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  geofence?: {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number; // em metros
    name: string;
  };
}

export class ProviderLocation implements IProviderLocation {
  id: string;
  providerId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: 'online' | 'offline' | 'busy' | 'available';
  lastUpdate: Date;
  batteryLevel: number;
  signalStrength: number;
  currentService?: {
    id: string;
    title: string;
    clientName: string;
    estimatedTime: number;
    startTime: Date;
  };
  rating: number;
  vehicle?: {
    model: string;
    plate: string;
    color: string;
    year?: number;
  };
  deviceInfo: {
    platform: 'ios' | 'android';
    version: string;
    model: string;
    osVersion: string;
  };
  locationAccuracy: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  isMoving: boolean;
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  geofence?: {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
    name: string;
  };

  constructor(data: Partial<IProviderLocation>) {
    this.id = data.id || '';
    this.providerId = data.providerId || '';
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.avatar = data.avatar;
    this.latitude = data.latitude || 0;
    this.longitude = data.longitude || 0;
    this.address = data.address;
    this.status = data.status || 'offline';
    this.lastUpdate = data.lastUpdate || new Date();
    this.batteryLevel = data.batteryLevel || 0;
    this.signalStrength = data.signalStrength || 0;
    this.currentService = data.currentService;
    this.rating = data.rating || 0;
    this.vehicle = data.vehicle;
    this.deviceInfo = data.deviceInfo || {
      platform: 'android',
      version: '1.0.0',
      model: 'Unknown',
      osVersion: 'Unknown'
    };
    this.locationAccuracy = data.locationAccuracy || 0;
    this.speed = data.speed;
    this.heading = data.heading;
    this.altitude = data.altitude;
    this.isMoving = data.isMoving || false;
    this.lastKnownLocation = data.lastKnownLocation;
    this.geofence = data.geofence;
  }

  // Atualizar localização
  updateLocation(latitude: number, longitude: number, accuracy: number = 0): void {
    this.lastKnownLocation = {
      latitude: this.latitude,
      longitude: this.longitude,
      timestamp: this.lastUpdate
    };
    
    this.latitude = latitude;
    this.longitude = longitude;
    this.locationAccuracy = accuracy;
    this.lastUpdate = new Date();
  }

  // Atualizar status do dispositivo
  updateDeviceStatus(batteryLevel: number, signalStrength: number): void {
    this.batteryLevel = batteryLevel;
    this.signalStrength = signalStrength;
    this.lastUpdate = new Date();
  }

  // Atualizar status do prestador
  updateStatus(status: IProviderLocation['status']): void {
    this.status = status;
    this.lastUpdate = new Date();
  }

  // Iniciar serviço
  startService(service: {
    id: string;
    title: string;
    clientName: string;
    estimatedTime: number;
  }): void {
    this.currentService = {
      ...service,
      startTime: new Date()
    };
    this.status = 'busy';
    this.lastUpdate = new Date();
  }

  // Finalizar serviço
  endService(): void {
    this.currentService = undefined;
    this.status = 'available';
    this.lastUpdate = new Date();
  }

  // Calcular distância até um ponto
  calculateDistanceTo(lat: number, lng: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat - this.latitude);
    const dLng = this.deg2rad(lng - this.longitude);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(this.latitude)) * Math.cos(this.deg2rad(lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  }

  // Converter graus para radianos
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Verificar se está dentro de uma geofence
  isInsideGeofence(centerLat: number, centerLng: number, radiusKm: number): boolean {
    const distance = this.calculateDistanceTo(centerLat, centerLng);
    return distance <= radiusKm;
  }

  // Obter dados públicos (mascarando informações sensíveis)
  getPublicData(): Omit<IProviderLocation, 'email' | 'phone'> & { 
    email: string; 
    phone: string; 
  } {
    const { email, phone, ...publicData } = this;
    return {
      ...publicData,
      email: this.maskEmail(email),
      phone: this.maskPhone(phone)
    };
  }

  // Mascarar email
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || localPart.length <= 2) {
      return email;
    }
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  // Mascarar telefone
  private maskPhone(phone: string): string {
    if (phone.length <= 4) return phone;
    const lastFour = phone.slice(-4);
    const masked = '*'.repeat(phone.length - 4);
    return `${masked}${lastFour}`;
  }

  // Verificar se está online (última atualização há menos de 5 minutos)
  isOnline(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastUpdate > fiveMinutesAgo;
  }

  // Obter tempo desde a última atualização
  getTimeSinceLastUpdate(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}m atrás`;
    return 'Agora';
  }
}
