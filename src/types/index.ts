export type Role = 'admin' | 'funcionario'

export interface User {
    id: string
    name: string
    role: Role
    works_saturday?: boolean
    part_time?: boolean
    work_start_time?: string
    work_end_time?: string
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

export type RecordType = 'entrada' | 'saida'

export interface Record {
    id: string
    user_id: string
    device_id: string
    timestamp: string
    geofence_id?: string
    record_type?: RecordType
    location: {
        lat: number
        lon: number
        accuracy: number
    }
    ip?: string
}

export interface DailyWorkSummary {
    date: string
    userName: string
    userId: string
    records: { time: string; type: RecordType }[]
    totalWorkedMinutes: number
    expectedMinutes: number
    balanceMinutes: number
}

export interface Geofence {
    id: string
    name: string
    latitude: number
    longitude: number
    radius: number
    active: boolean
}
