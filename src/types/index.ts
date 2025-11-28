export type Role = 'admin' | 'funcionario'

export interface User {
    id: string
    name: string
    role: Role
    created_at: string
    // Populated via join with device_authorizations
    devices?: DeviceAuthorization[]
}

export interface DeviceAuthorization {
    id: string
    user_id: string
    device_id: string
    device_name?: string
    authorized_at: string
}

export interface Record {
    id: string
    user_id: string
    device_id: string
    timestamp: string
    geofence_id?: string
    location: {
        lat: number
        lon: number
        accuracy: number
    }
    ip?: string
}

export interface Geofence {
    id: string
    name: string
    latitude: number
    longitude: number
    radius: number
    active: boolean
}
