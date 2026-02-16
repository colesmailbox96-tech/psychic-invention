import { RNG } from '../utils/RNG';
import { TimeManager } from './TimeManager';

export type WeatherType =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'drought'
  | 'fog';

export class WeatherSystem {
  currentWeather: WeatherType;
  intensity: number;
  private duration: number;
  private rng: RNG;

  constructor(rng: RNG) {
    this.rng = rng;
    this.currentWeather = 'clear';
    this.intensity = 0;
    this.duration = 0;
  }

  update(timeManager: TimeManager): void {
    if (this.duration > 0) {
      this.duration--;
      return;
    }
    this.pickNewWeather(timeManager);
  }

  private pickNewWeather(timeManager: TimeManager): void {
    const season = timeManager.season;
    const roll = this.rng.next();

    let weather: WeatherType;
    switch (season) {
      case 'spring':
        if (roll < 0.3) weather = 'rain';
        else if (roll < 0.45) weather = 'cloudy';
        else if (roll < 0.55) weather = 'fog';
        else weather = 'clear';
        break;
      case 'summer':
        if (roll < 0.15) weather = 'drought';
        else if (roll < 0.25) weather = 'storm';
        else if (roll < 0.35) weather = 'cloudy';
        else weather = 'clear';
        break;
      case 'autumn':
        if (roll < 0.25) weather = 'storm';
        else if (roll < 0.4) weather = 'rain';
        else if (roll < 0.55) weather = 'cloudy';
        else if (roll < 0.65) weather = 'fog';
        else weather = 'clear';
        break;
      case 'winter':
        if (roll < 0.3) weather = 'snow';
        else if (roll < 0.45) weather = 'cloudy';
        else if (roll < 0.55) weather = 'fog';
        else weather = 'clear';
        break;
      default:
        weather = 'clear';
    }

    this.currentWeather = weather;
    this.intensity = this.rng.nextFloat(0.3, 1.0);
    // Duration: 2-8 in-game hours worth of ticks
    this.duration = this.rng.nextInt(200, 800);
  }

  getMovementModifier(): number {
    switch (this.currentWeather) {
      case 'rain': return 1.0 + 0.3 * this.intensity;
      case 'storm': return 1.0 + 0.6 * this.intensity;
      case 'snow': return 1.0 + 0.5 * this.intensity;
      case 'fog': return 1.0 + 0.1 * this.intensity;
      default: return 1.0;
    }
  }

  getVisibilityModifier(): number {
    switch (this.currentWeather) {
      case 'fog': return 1.0 - 0.5 * this.intensity;
      case 'rain': return 1.0 - 0.2 * this.intensity;
      case 'storm': return 1.0 - 0.4 * this.intensity;
      case 'snow': return 1.0 - 0.3 * this.intensity;
      default: return 1.0;
    }
  }

  getWarmthModifier(): number {
    switch (this.currentWeather) {
      case 'snow': return -0.3 * this.intensity;
      case 'rain': return -0.1 * this.intensity;
      case 'storm': return -0.2 * this.intensity;
      case 'drought': return 0.2 * this.intensity;
      case 'clear': return 0.05;
      default: return 0.0;
    }
  }

  getResourceModifier(): number {
    switch (this.currentWeather) {
      case 'rain': return 1.0 + 0.2 * this.intensity;
      case 'drought': return 1.0 - 0.4 * this.intensity;
      case 'storm': return 1.0 - 0.3 * this.intensity;
      default: return 1.0;
    }
  }
}
