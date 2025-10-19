use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Location {
    pub latitude: i32,
    pub longitude: i32,
    pub region_code: u16,
    pub country_code: u16,
    pub city_hash: u64,
}

impl Location {
    pub const PRECISION: i32 = 1_000_000;
    
    pub fn from_coords(lat: f64, lon: f64) -> Self {
        Self {
            latitude: (lat * Self::PRECISION as f64) as i32,
            longitude: (lon * Self::PRECISION as f64) as i32,
            region_code: 0,
            country_code: 0,
            city_hash: 0,
        }
    }
    
    pub fn to_coords(&self) -> (f64, f64) {
        (
            self.latitude as f64 / Self::PRECISION as f64,
            self.longitude as f64 / Self::PRECISION as f64,
        )
    }
    
    pub fn distance_to(&self, other: &Location) -> f64 {
        let (lat1, lon1) = self.to_coords();
        let (lat2, lon2) = other.to_coords();
        
        let r = 6371000.0;
        let phi1 = lat1.to_radians();
        let phi2 = lat2.to_radians();
        let delta_phi = (lat2 - lat1).to_radians();
        let delta_lambda = (lon2 - lon1).to_radians();
        
        let a = (delta_phi / 2.0).sin().powi(2) + phi1.cos() * phi2.cos() * (delta_lambda / 2.0).sin().powi(2);
        let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
        
        r * c
    }
}

#[account]
#[derive(InitSpace)]
pub struct GeoCell {
    pub cell_id: u64,
    pub min_latitude: i32,
    pub max_latitude: i32,
    pub min_longitude: i32,
    pub max_longitude: i32,
    pub promotion_count: u32,
}

impl GeoCell {
    pub const GRID_SIZE: i32 = 100_000;
    
    pub fn from_coords(lat: f64, lon: f64) -> (i32, i32) {
        let lat_int = (lat * Location::PRECISION as f64) as i32;
        let lon_int = (lon * Location::PRECISION as f64) as i32;
        
        (lat_int / Self::GRID_SIZE, lon_int / Self::GRID_SIZE)
    }
    
    pub fn to_cell_id(cell_lat: i32, cell_lon: i32) -> u64 {
        ((cell_lat as u64) << 32) | ((cell_lon as u64) & 0xFFFFFFFF)
    }
}