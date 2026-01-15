import { useState, useRef } from 'react';
import { X, Camera, Image, Type, Send, Trash2, Loader2 } from 'lucide-react';
import { analyzeFood, transformAnalysisForUI, uploadFoodPhoto } from '../../lib/foodAnalysisService';
import './AddFoodModal.css';

export default function AddFoodModal({ isOpen, onClose, onSave, mealName, mealColor, mealType = 'lunch' }) {
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'camera' | 'gallery'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handlePhotoChange = (e, source) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setActiveTab(source);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    // Reset file inputs
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!text.trim() && !photo) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      let analysisResult = null;
      let photoUrl = null;

      // Если есть фото
      if (photo) {
        // 1. Загружаем фото в Supabase Storage
        try {
          console.log('Uploading photo to Supabase...');
          photoUrl = await uploadFoodPhoto(photo, mealType);
          console.log('Photo uploaded:', photoUrl);
        } catch (error) {
          console.error('Upload failed:', error);
          // Если не удалось загрузить — используем base64 как fallback
          photoUrl = photoPreview;
        }

        // 2. Отправляем на анализ
        try {
          console.log('Analyzing food photo...');
          const rawAnalysis = await analyzeFood(photo, mealType);
          analysisResult = transformAnalysisForUI(rawAnalysis);
          console.log('Analysis complete:', analysisResult);
        } catch (error) {
          console.error('Analysis failed:', error);
          setAnalysisError('Не удалось проанализировать фото. Сохраняем без анализа.');
          // Продолжаем сохранение даже если анализ не удался
        }
      }

      const foodEntry = {
        id: Date.now(),
        text: text.trim(),
        photo: photoUrl || photoPreview, // URL из Supabase или base64 как fallback
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        analysis: analysisResult // Результат анализа от AI
      };

      onSave(foodEntry);
      handleClose();
    } catch (error) {
      console.error('Submit failed:', error);
      setAnalysisError('Произошла ошибка. Попробуйте ещё раз.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    setText('');
    setPhoto(null);
    setPhotoPreview(null);
    setActiveTab('text');
    setIsAnalyzing(false);
    setAnalysisError(null);
    onClose();
  };

  if (!isOpen) return null;

  const canSubmit = text.trim() || photo;

  return (
    <div className="add-food-overlay" onClick={handleClose}>
      <div className="add-food-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="add-food-header" style={{ borderColor: mealColor }}>
          <h3>{mealName}</h3>
          <button className="add-food-close" onClick={handleClose}>
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="add-food-tabs">
          <button 
            className={`add-food-tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <Type size={18} />
            <span>Текст</span>
          </button>
          <button 
            className={`add-food-tab ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={handleCameraClick}
          >
            <Camera size={18} />
            <span>Камера</span>
          </button>
          <button 
            className={`add-food-tab ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={handleGalleryClick}
          >
            <Image size={18} />
            <span>Галерея</span>
          </button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handlePhotoChange(e, 'camera')}
          style={{ display: 'none' }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoChange(e, 'gallery')}
          style={{ display: 'none' }}
        />

        {/* Content */}
        <div className="add-food-content">
          {/* Photo Preview */}
          {photoPreview && (
            <div className="add-food-photo-preview">
              <img src={photoPreview} alt="Фото еды" />
              <button className="remove-photo-btn" onClick={removePhoto}>
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {/* Text Input */}
          <div className="add-food-text-wrap">
            <textarea
              className="add-food-textarea"
              placeholder="Что вы съели? Например: Овсянка с бананом и мёдом"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={photoPreview ? 2 : 4}
            />
          </div>
        </div>

        {/* Error Message */}
        {analysisError && (
          <div className="add-food-error">
            ⚠️ {analysisError}
          </div>
        )}

        {/* Submit Button */}
        <div className="add-food-footer">
          <button 
            className="add-food-submit"
            style={{ background: canSubmit && !isAnalyzing ? mealColor : '#D1D5DB' }}
            onClick={handleSubmit}
            disabled={!canSubmit || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Анализируем...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>{photo ? 'Проанализировать и сохранить' : 'Сохранить'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
