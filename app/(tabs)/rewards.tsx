import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RewardCard from '@/components/RewardCard';
import RedeemedRewardsList from '@/components/RedeemedRewardsList';
import { Star, Gift, Filter, Plus, X, Save } from 'lucide-react-native';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useChildren, useRewards } from '@/hooks/useFirestore';
import { RewardCategory } from '@/types';

export default function RewardsScreen() {
  const { user, familyId } = useFirebaseAuth();
  const { children, loading: childrenLoading } = useChildren(familyId);
  const { rewards, loading: rewardsLoading, createReward, redeemReward } = useRewards(familyId);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReward, setNewReward] = useState({
    title: '',
    description: '',
    pointsCost: '',
    category: 'treats' as RewardCategory,
  });

  const isParent = user?.role === 'parent';
  const currentChild = user?.userid ? children.find(child => child.id === user.userid) : null;
  
  // For parents, default to first child; for children, use their own data
  const [selectedChild, setSelectedChild] = useState(isParent ? children[0]?.id || '' : user?.userid || '');
  const [activeTab, setActiveTab] = useState<'available' | 'redeemed'>('available');

  const selectedChildData = children.find(child => child.id === selectedChild);

  React.useEffect(() => {
    if (isParent && children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    } else if (!isParent && user?.userid && !selectedChild) {
      setSelectedChild(user.userid);
    }
  }, [children, isParent, user, selectedChild]);

  const handleRedeem = async (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || !selectedChildData) return;

    if ((selectedChildData.points || 0) < reward.pointsCost) {
      Alert.alert('Not enough points', 'You need more points to redeem this reward.');
      return;
    }

    const actionText = isParent ? 'approve this redemption' : 'redeem this reward';
    const confirmText = isParent ? 'Approve' : 'Redeem';

    Alert.alert(
      `${confirmText} Reward`,
      `Are you sure you want to ${actionText} "${reward.title}" for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: confirmText,
          onPress: async () => {
            try {
              await redeemReward(selectedChildData.id, rewardId, reward.pointsCost);
              const message = isParent 
                ? `${reward.title} has been approved for ${selectedChildData.name}!`
                : `${reward.title} has been redeemed! Enjoy your reward!`;
              Alert.alert('Success!', message);
            } catch (error) {
              console.error('Error redeeming reward:', error);
              Alert.alert('Error', 'Failed to redeem reward. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCreateReward = async () => {
    if (!newReward.title.trim() || !newReward.description.trim() || !newReward.pointsCost) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const pointsCost = parseInt(newReward.pointsCost);
    if (isNaN(pointsCost) || pointsCost <= 0) {
      Alert.alert('Error', 'Please enter a valid points cost');
      return;
    }

    try {
      await createReward({
        title: newReward.title,
        description: newReward.description,
        pointsCost,
        category: newReward.category,
        available: true,
      });

      setNewReward({ title: '', description: '', pointsCost: '', category: 'treats' });
      setShowAddModal(false);
      Alert.alert('Success', 'Reward created successfully!');
    } catch (error) {
      console.error('Error creating reward:', error);
      Alert.alert('Error', 'Failed to create reward. Please try again.');
    }
  };

  const rewardCategories: { value: RewardCategory; label: string }[] = [
    { value: 'screen-time', label: 'Screen Time' },
    { value: 'treats', label: 'Treats' },
    { value: 'activities', label: 'Activities' },
    { value: 'money', label: 'Money' },
    { value: 'privileges', label: 'Privileges' },
  ];

  const categorizedRewards = rewards.reduce((acc, reward) => {
    if (!acc[reward.category]) {
      acc[reward.category] = [];
    }
    acc[reward.category].push(reward);
    return acc;
  }, {} as Record<string, typeof rewards>);

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'screen-time': return 'Screen Time';
      case 'treats': return 'Treats & Snacks';
      case 'activities': return 'Activities';
      case 'money': return 'Money & Allowance';
      case 'privileges': return 'Special Privileges';
      default: return category;
    }
  };

  if (childrenLoading || rewardsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rewards Store</Text>
            <Text style={styles.subtitle}>
              {isParent ? 'Manage rewards for your children!' : 'Redeem points for awesome rewards!'}
            </Text>
          </View>
          {isParent && (
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Child Selection - Only for Parents */}
        {isParent && (
          <View style={styles.childSelection}>
            <Text style={styles.sectionTitle}>Select Child</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childrenScroll}>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childCard,
                    selectedChild === child.id && styles.selectedChildCard
                  ]}
                  onPress={() => setSelectedChild(child.id)}
                >
                  <View style={styles.childCardHeader}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <View style={styles.pointsBadge}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text style={styles.pointsText}>{child.points || 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.childLevel}>Level {child.level || 1}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Available Points */}
        {selectedChildData && (
          <View style={styles.pointsContainer}>
            <Gift size={24} color={isParent ? "#3b82f6" : "#10b981"} />
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsTitle}>
                {isParent ? `${selectedChildData.name}'s Points` : 'Your Available Points'}
              </Text>
              <Text style={styles.pointsValue}>{selectedChildData.points || 0} points</Text>
            </View>
          </View>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
              Available Rewards
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'redeemed' && styles.activeTab]}
            onPress={() => setActiveTab('redeemed')}
          >
            <Text style={[styles.tabText, activeTab === 'redeemed' && styles.activeTabText]}>
              Redeemed Rewards
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'available' ? (
          /* Available Rewards */
          <View style={styles.rewardsContainer}>
            {Object.entries(categorizedRewards).map(([category, categoryRewards]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{getCategoryTitle(category)}</Text>
                {categoryRewards.map(reward => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onRedeem={handleRedeem}
                    canAfford={selectedChildData ? (selectedChildData.points || 0) >= reward.pointsCost : false}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : (
          /* Redeemed Rewards */
          <View style={styles.redeemedContainer}>
            <RedeemedRewardsList childId={selectedChild} />
          </View>
        )}

        {/* Add Custom Reward Button - Only for Parents */}
        {isParent && (
          <TouchableOpacity style={styles.addRewardButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addRewardButtonText}>+ Add Custom Reward</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Reward Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setShowAddModal(false)}
            >
              <X size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Custom Reward</Text>
            <TouchableOpacity 
              style={styles.modalSaveButton} 
              onPress={handleCreateReward}
            >
              <Save size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Reward Title</Text>
              <TextInput
                style={styles.textInput}
                value={newReward.title}
                onChangeText={(text) => setNewReward(prev => ({ ...prev, title: text }))}
                placeholder="Enter reward title..."
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newReward.description}
                onChangeText={(text) => setNewReward(prev => ({ ...prev, description: text }))}
                placeholder="Describe the reward..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Points Cost</Text>
              <TextInput
                style={styles.textInput}
                value={newReward.pointsCost}
                onChangeText={(text) => setNewReward(prev => ({ ...prev, pointsCost: text }))}
                placeholder="Enter points cost..."
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {rewardCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryOption,
                      newReward.category === cat.value && styles.selectedCategoryOption
                    ]}
                    onPress={() => setNewReward(prev => ({ ...prev, category: cat.value }))}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newReward.category === cat.value && styles.selectedCategoryOptionText
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  childSelection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  childrenScroll: {
    paddingLeft: 20,
  },
  childCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 140,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedChildCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  childCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  childName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#d97706',
    marginLeft: 2,
  },
  childLevel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pointsInfo: {
    marginLeft: 16,
  },
  pointsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  pointsValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginTop: 2,
  },
  rewardsContainer: {
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  addRewardButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  addRewardButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  modalSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 100,
  },
  selectedCategoryOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  selectedCategoryOptionText: {
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  activeTabText: {
    color: '#1e293b',
    fontFamily: 'Inter-SemiBold',
  },
  redeemedContainer: {
    flex: 1,
  },
});