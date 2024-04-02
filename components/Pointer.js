import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, View, Text, Switch, Image } from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';

import fingerImage from '../assets/finger.png';
import fryImage from '../assets/fry.png';

export default function Pointer({ targetCoordinate }) {
    const [deviceLocation, setDeviceLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const [distance, setDistance] = useState(0);
    const [isVegetarian, setVegetarianMode] = useState(false);

    const toggleVegetarianMode = () => {
        setVegetarianMode(previousState => !previousState);
    };

    useEffect(() => {
        async function fetchLocation() {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permission to access location was denied');
                return;
            }

            Location.watchPositionAsync({}, (location) => {
                setDeviceLocation(location.coords);
                const { latitude, longitude } = location.coords;
                const deltaLongitude = targetCoordinate.longitude - longitude;
                const deltaLatitude = targetCoordinate.latitude - latitude;

                // Calculate distance
                const R = 6371; // Radius of Earth in kilometers
                const φ1 = latitude * Math.PI / 180;
                const φ2 = targetCoordinate.latitude * Math.PI / 180;
                const Δφ = deltaLatitude * Math.PI / 180;
                const Δλ = deltaLongitude * Math.PI / 180;

                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                const d = Math.round(R * c * 10) / 10; // Distance in meters
                setDistance(d);
            })
        }

        fetchLocation();
    }, []);

    useEffect(() => {
        Magnetometer.addListener((data) => {
            const { x, y } = data;
            const angle = Math.atan2(y, x) * (180 / Math.PI);
            const imageOffset = -45;
            setHeading(Math.round(angle >= 0 ? angle : 360 + angle) + imageOffset);
        });

        Magnetometer.setUpdateInterval(100); // Update interval in milliseconds

        return () => {
            Magnetometer.removeAllListeners();
        };
    }, []);

    const image = isVegetarian ? fryImage : fingerImage;
    const imageScale = distance ? 5 / distance : 1; // increase scale as distance decreases
    return deviceLocation && (
        <View style={styles.container}>
            <View style={styles.innerContainer}>

                <View style={styles.imageContainer}>
                    <Image
                        source={image}
                        style={[styles.image, {
                            transform: [
                                { rotate: `${-heading}deg` },
                                { scale: imageScale },
                            ]
                        }]}
                    />
                </View>
                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Vegetarian</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: "#d71c2e" }}
                        thumbColor={isVegetarian ? "#f5dd4b" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleVegetarianMode}
                        value={isVegetarian}
                    />
                </View>
                <Text style={styles.heading}>Distance: {distance ? `${distance} km` : 'Calculating'}</Text>
            </View>
        </View>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        backgroundColor: '#fff',
    },
    innerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    heading: {
        fontSize: 20,
        marginBottom: 20,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    label: {
        marginRight: 10,
    },
    imageContainer: {
        width: width * 0.8,
        aspectRatio: 1,
    },
    image: {
        flex: 1, // Take up all available space
        resizeMode: 'contain',
    },
});