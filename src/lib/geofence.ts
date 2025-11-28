export function getDistanceFromLatLonInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Radius of the earth in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in meters
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

export function isInsideGeofence(
    userLat: number,
    userLon: number,
    fenceLat: number,
    fenceLon: number,
    radius: number
): boolean {
    const distance = getDistanceFromLatLonInMeters(
        userLat,
        userLon,
        fenceLat,
        fenceLon
    );
    return distance <= radius;
}
