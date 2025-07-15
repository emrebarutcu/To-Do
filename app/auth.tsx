import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { router } from 'expo-router';
import { User, Users, Lock, Mail, ArrowRight } from 'lucide-react-native';

export default function AuthScreen() {
  const [selectedRole, setSelectedRole] = useState<'parent' | 'child' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useFirebaseAuth();

  const handleLogin = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select whether you are a parent or child');
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const success = await login(email, password, selectedRole);
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    }
  };

  const fillDemoCredentials = (role: 'parent' | 'child', userEmail?: string) => {
    setSelectedRole(role);
    setEmail(userEmail || (role === 'parent' ? 'emrebarutcuoff@gmail.com' : 'skk@flld.co'));
    setPassword(role == 'parent' ? 'emre2003': "112233");
  };

  if (selectedRole === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeContainer}>
          {/* Compact Header */}
          <View style={styles.compactHeader}>
            <Text style={styles.logoEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.logoText}>Family Tasks</Text>
            <Text style={styles.welcomeSubtitle}>Choose your role to get started</Text>
          </View>

          {/* Role Selection Cards */}
          <View style={styles.roleSelection}>
            <TouchableOpacity
              style={[styles.roleCard, styles.parentCard]}
              onPress={() => fillDemoCredentials('parent')}
            >
              <View style={styles.roleHeader}>
                <View style={styles.parentIconContainer}>
                  <Users size={24} color="#ffffff" />
                </View>
                <Text style={styles.roleTitle}>Parent</Text>
              </View>
              <Text style={styles.roleDescription}>Manage family tasks and rewards</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, styles.childCard]}
              onPress={() => fillDemoCredentials('child')}
            >
              <View style={styles.roleHeader}>
                <View style={styles.childIconContainer}>
                  <User size={24} color="#ffffff" />
                </View>
                <Text style={styles.roleTitle}>Child</Text>
              </View>
              <Text style={styles.roleDescription}>Complete tasks and earn rewards</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Access */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Quick Demo</Text>
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.createAccountText}>Create Parent Account</Text>
            </TouchableOpacity>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => fillDemoCredentials('child', 'emma@family.com')}
              >
                <Text style={styles.demoButtonText}>Emma</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => fillDemoCredentials('child', 'liam@family.com')}
              >
                <Text style={styles.demoButtonText}>Liam</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => fillDemoCredentials('child', 'sophie@family.com')}
              >
                <Text style={styles.demoButtonText}>Sophie</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginContainer}>
        {/* Compact Login Header */}
        <View style={styles.loginHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRole(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.loginTitleSection}>
            <View style={[styles.roleIndicator, selectedRole === 'parent' ? styles.parentRole : styles.childRole]}>
              {selectedRole === 'parent' ? (
                <Users size={20} color="#ffffff" />
              ) : (
                <User size={20} color="#ffffff" />
              )}
            </View>
            <Text style={styles.loginTitle}>
              {selectedRole === 'parent' ? 'Parent Login' : 'Child Login'}
            </Text>
          </View>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Mail size={18} color="#64748b" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Lock size={18} color="#64748b" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, selectedRole === 'parent' ? styles.parentButton : styles.childButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>
                  {selectedRole === 'parent' ? 'Access Dashboard' : 'Start Tasks'}
                </Text>
                <ArrowRight size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo Credentials */}
        <View style={styles.demoCredentials}>
          <Text style={styles.demoCredentialsTitle}>Demo Credentials</Text>
          <Text style={styles.demoCredentialsText}>
            {selectedRole === 'parent' ? 'parent@family.com' : 'emma@family.com'} • password123
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  compactHeader: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  roleSelection: {
    gap: 16,
    paddingVertical: 20,
  },
  roleCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  parentCard: {
    backgroundColor: '#3b82f6',
  },
  childCard: {
    backgroundColor: '#10b981',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  parentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  roleDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  demoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  demoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  demoButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
  },
  createAccountButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createAccountText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  loginContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  loginHeader: {
    paddingTop: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#3b82f6',
  },
  loginTitleSection: {
    alignItems: 'center',
  },
  roleIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  parentRole: {
    backgroundColor: '#3b82f6',
  },
  childRole: {
    backgroundColor: '#10b981',
  },
  loginTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  form: {
    gap: 16,
    paddingVertical: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    paddingVertical: 14,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  parentButton: {
    backgroundColor: '#3b82f6',
  },
  childButton: {
    backgroundColor: '#10b981',
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  demoCredentials: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  demoCredentialsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
    marginBottom: 4,
  },
  demoCredentialsText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
});