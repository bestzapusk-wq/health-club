import { useState, useEffect } from 'react';
import { ChevronDown, Plus, User, Users } from 'lucide-react';
import { familyService, getRelationLabel } from '../../lib/familyService';
import AddFamilyMemberModal from './AddFamilyMemberModal';
import './ProfileSwitcher.css';

/**
 * Компонент переключения между профилями (свой / родственники)
 */
const ProfileSwitcher = ({ 
  userId, 
  currentProfile, 
  onProfileChange,
  userName 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadFamilyMembers();
    }
  }, [userId]);

  const loadFamilyMembers = async () => {
    setLoading(true);
    try {
      const members = await familyService.getFamilyMembers(userId);
      setFamilyMembers(members);
    } catch (err) {
      console.error('Error loading family members:', err);
    } finally {
      setLoading(false);
    }
  };

  const profiles = [
    { id: 'self', name: userName || 'Я', type: 'self', Icon: User },
    ...familyMembers.map(m => ({ 
      id: m.id, 
      name: m.name, 
      type: 'family',
      relation: m.relation,
      Icon: Users 
    }))
  ];

  const currentProfileData = profiles.find(p => 
    currentProfile.type === 'self' 
      ? p.type === 'self' 
      : p.id === currentProfile.familyMemberId
  ) || profiles[0];

  const handleSelectProfile = (profile) => {
    onProfileChange({
      type: profile.type,
      familyMemberId: profile.type === 'family' ? profile.id : null
    });
    setIsOpen(false);
  };

  const handleAddMember = () => {
    setShowAddModal(true);
    setIsOpen(false);
  };

  const handleMemberAdded = () => {
    loadFamilyMembers();
    setShowAddModal(false);
  };

  // Если нет родственников — показываем просто имя с иконкой, без дропдауна
  const hasFamilyMembers = familyMembers.length > 0;

  return (
    <div className="profile-switcher">
      <button 
        className={`profile-switcher-btn ${!hasFamilyMembers ? 'no-dropdown' : ''}`}
        onClick={() => hasFamilyMembers ? setIsOpen(!isOpen) : setShowAddModal(true)}
      >
        <currentProfileData.Icon size={18} />
        <span>{currentProfileData.name}</span>
        {hasFamilyMembers && <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />}
      </button>

      {isOpen && hasFamilyMembers && (
        <>
          <div className="profile-dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="profile-dropdown">
            {profiles.map(profile => (
              <button
                key={profile.id}
                className={`profile-option ${
                  (currentProfile.type === 'self' && profile.type === 'self') ||
                  (currentProfile.familyMemberId === profile.id)
                    ? 'active' 
                    : ''
                }`}
                onClick={() => handleSelectProfile(profile)}
              >
                <profile.Icon size={18} />
                <div className="profile-info">
                  <span className="profile-name">{profile.name}</span>
                  {profile.relation && (
                    <span className="profile-relation">
                      {getRelationLabel(profile.relation)}
                    </span>
                  )}
                </div>
              </button>
            ))}
            
            <button 
              className="add-profile-btn"
              onClick={handleAddMember}
            >
              <Plus size={18} />
              <span>Добавить родственника</span>
            </button>
          </div>
        </>
      )}

      {showAddModal && (
        <AddFamilyMemberModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onAdded={handleMemberAdded}
        />
      )}
    </div>
  );
};

export default ProfileSwitcher;
