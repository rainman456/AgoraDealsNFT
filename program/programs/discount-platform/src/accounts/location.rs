use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Location {
    pub latitude: i32,      // Multiply by 1_000_000 to store as integer
    pub longitude: i32,     // e.g., 40.7128 → 40712800
    pub region_code: u16,   // Hierarchical region identifier
    pub country_code: u16,  // ISO country code as number
    pub city_hash: u64,     // Hash of city name for filtering
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
    
    // Calculate distance in meters using Haversine formula
    pub fn distance_to(&self, other: &Location) -> f64 {
        let (lat1, lon1) = self.to_coords();
        let (lat2, lon2) = other.to_coords();
        
        let r = 6371000.0; // Earth radius in meters
        let phi1 = lat1.to_radians();
        let phi2 = lat2.to_radians();
        let delta_phi = (lat2 - lat1).to_radians();
        let delta_lambda = (lon2 - lon1).to_radians();
        
        let a = (delta_phi / 2.0).sin().powi(2)
            + phi1.cos() * phi2.cos() * (delta_lambda / 2.0).sin().powi(2);
        let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
        
        r * c
    }
}

// Geographic grid cell for spatial indexing
#[account]
#[derive(InitSpace)]
pub struct GeoCell {
    pub cell_id: u64,           // Unique cell identifier
    pub min_latitude: i32,       // Bounding box
    pub max_latitude: i32,
    pub min_longitude: i32,
    pub max_longitude: i32,
    pub promotion_count: u32,    // Number of promotions in this cell
}

impl GeoCell {
    // Grid resolution: ~11km at equator
    pub const GRID_SIZE: i32 = 100_000; // 0.1 degrees
    
    pub fn from_coords(lat: f64, lon: f64) -> (i32, i32) {
        let lat_int = (lat * Location::PRECISION as f64) as i32;
        let lon_int = (lon * Location::PRECISION as f64) as i32;
        
        let cell_lat = lat_int / Self::GRID_SIZE;
        let cell_lon = lon_int / Self::GRID_SIZE;
        
        (cell_lat, cell_lon)
    }
    
    pub fn to_cell_id(cell_lat: i32, cell_lon: i32) -> u64 {
        // Encode as single u64: upper 32 bits = lat, lower 32 bits = lon
        ((cell_lat as u64) << 32) | ((cell_lon as u64) & 0xFFFFFFFF)
    }
}