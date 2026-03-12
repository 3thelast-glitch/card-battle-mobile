import React from 'react';
import { Text as RNText, TextProps, StyleSheet, Platform } from 'react-native';

/**
 * مكون نص عالمي يطبق خط DG-Bold تلقائياً
 */
export function ThemedText({ style, ...props }: TextProps) {
    return (
        <RNText
            {...props}
            style={[
                styles.defaultText,
                style, // هذا يسمح بتمرير أي تنسيق إضافي (مثل الألوان أو الأحجام) من الشاشات
            ]}
        />
    );
}

const styles = StyleSheet.create({
    defaultText: {
        fontFamily: 'DG-Bold',
        // إضافة مساحة بسيطة في الأعلى لتحسين مظهر الحركات العربية في iOS
        paddingTop: Platform.OS === 'ios' ? 2 : 0,
    },
});