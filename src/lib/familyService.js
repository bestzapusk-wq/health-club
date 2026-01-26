import { supabase } from './supabase';

/**
 * Сервис для работы с профилями родственников
 */
export const familyService = {
  /**
   * Получить всех родственников пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Array>} Массив родственников
   */
  async getFamilyMembers(userId) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (error) {
        // Таблица может не существовать — не критично
        console.warn('Family members not available:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('Family members error:', e);
      return [];
    }
  },

  /**
   * Добавить родственника
   * @param {string} userId - ID пользователя
   * @param {Object} memberData - Данные родственника
   * @returns {Promise<Object>} Созданный родственник
   */
  async addFamilyMember(userId, memberData) {
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        user_id: userId,
        name: memberData.name,
        gender: memberData.gender,
        age: memberData.age,
        relation: memberData.relation
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
    return data;
  },

  /**
   * Обновить родственника
   * @param {string} memberId - ID родственника
   * @param {Object} memberData - Новые данные
   * @returns {Promise<Object>} Обновлённый родственник
   */
  async updateFamilyMember(memberId, memberData) {
    const { data, error } = await supabase
      .from('family_members')
      .update({
        name: memberData.name,
        gender: memberData.gender,
        age: memberData.age,
        relation: memberData.relation,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating family member:', error);
      throw error;
    }
    return data;
  },

  /**
   * Удалить родственника
   * @param {string} memberId - ID родственника
   * @returns {Promise<boolean>} Успешность удаления
   */
  async deleteFamilyMember(memberId) {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);
    
    if (error) {
      console.error('Error deleting family member:', error);
      throw error;
    }
    return true;
  },

  /**
   * Получить данные конкретного родственника
   * @param {string} memberId - ID родственника
   * @returns {Promise<Object|null>} Данные родственника
   */
  async getFamilyMember(memberId) {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching family member:', error);
      throw error;
    }
    return data;
  },

  /**
   * Получить всех родственников с их последними разборами
   * @param {string} userId - ID пользователя
   * @returns {Promise<Array>} Массив родственников с hasAnalysis флагом
   */
  async getFamilyMembersWithAnalysis(userId) {
    try {
      // Получаем родственников
      const members = await this.getFamilyMembers(userId);
      
      // Для каждого проверяем наличие разбора
      const membersWithStatus = await Promise.all(
        members.map(async (member) => {
          const { data } = await supabase
            .from('analysis_results')
            .select('id')
            .eq('family_member_id', member.id)
            .in('status', ['completed', 'ready'])
            .limit(1);
          
          return {
            ...member,
            hasAnalysis: data && data.length > 0
          };
        })
      );
      
      return membersWithStatus;
    } catch (e) {
      console.warn('Error fetching family members with analysis:', e);
      return [];
    }
  }
};

/**
 * Получить отображаемое название родственной связи
 * @param {string} relation - Код связи
 * @returns {string} Название на русском
 */
export const getRelationLabel = (relation) => {
  const labels = {
    'spouse': 'Супруг(а)',
    'child': 'Ребёнок',
    'parent': 'Родитель',
    'sibling': 'Брат/сестра',
    'other': 'Другое'
  };
  return labels[relation] || relation;
};

export default familyService;
