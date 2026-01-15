import { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatFileSize } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import './UploadModal.css';

// Поддерживаемые типы файлов
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadModal({ isOpen, onClose, onSave, userId }) {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  // Загружаем уже загруженные файлы при открытии
  useEffect(() => {
    if (isOpen && userId) {
      loadUploadedFiles();
    }
  }, [isOpen, userId]);

  const loadUploadedFiles = async () => {
    if (!userId) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (fetchError) {
        console.error('Error loading files:', fetchError);
        return;
      }
      setUploadedFiles(data || []);
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  // Получаем расширение файла (нормализованное)
  const getFileExtension = (fileName) => {
    const parts = fileName.split('.');
    if (parts.length < 2) return '';
    return parts[parts.length - 1].toLowerCase();
  };

  // Определяем тип файла для БД (pdf или image)
  const getDbFileType = (file) => {
    const ext = getFileExtension(file.name);
    
    // Сначала проверяем по расширению (более надёжно)
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    
    // Fallback на MIME-тип
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    
    return 'other';
  };

  // Проверяем валидность файла
  const validateFile = (file) => {
    const ext = getFileExtension(file.name);
    const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
    const isValidMime = ALLOWED_MIME_TYPES.includes(file.type);
    
    // Файл валиден если расширение ИЛИ MIME-тип совпадает
    if (!isValidExt && !isValidMime) {
      return { valid: false, error: `Неподдерживаемый формат: ${file.name}. Используйте PDF, JPG или PNG` };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `Файл слишком большой: ${file.name}. Максимум 10 МБ` };
    }
    
    if (file.size === 0) {
      return { valid: false, error: `Файл пустой: ${file.name}` };
    }
    
    return { valid: true };
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    
    setError('');
    const validFiles = [];
    const errors = [];

    for (const file of selectedFiles) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        errors.push(validation.error);
        continue;
      }
      
      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        status: 'pending' // pending, uploading, uploaded, error
      });
    }

    if (errors.length > 0) {
      setError(errors[0]); // Показываем первую ошибку
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
    
    // Сбрасываем input для повторного выбора того же файла
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setError('');
  };

  const handleRemoveUploaded = async (fileId, filePath) => {
    if (!fileId) return;
    
    try {
      // Удаляем из Storage (если путь есть)
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('health-files')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Storage delete warning:', storageError);
          // Продолжаем даже если не удалось удалить из storage
        }
      }
      
      // Удаляем из базы данных
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId);
      
      if (dbError) {
        throw dbError;
      }
      
      // Обновляем список
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Error removing file:', err);
      setError('Ошибка при удалении файла');
    }
  };

  // Генерируем безопасное имя файла для Storage
  const generateSafeFileName = (originalName) => {
    const ext = getFileExtension(originalName) || 'bin';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    return `${timestamp}_${random}.${ext}`;
  };

  const uploadFileToStorage = async (file) => {
    const safeFileName = generateSafeFileName(file.name);
    const filePath = `${userId}/${safeFileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('health-files')
      .upload(filePath, file.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(uploadError.message || 'Ошибка загрузки в хранилище');
    }
    
    return data.path;
  };

  const saveFileMetadata = async (file, storagePath) => {
    const dbFileType = getDbFileType(file);
    
    const { data, error: insertError } = await supabase
      .from('uploaded_files')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_type: dbFileType,
        file_size: file.size,
        file_path: storagePath
      })
      .select()
      .single();

    if (insertError) {
      console.error('DB insert error:', insertError);
      // Пытаемся удалить файл из Storage если не удалось сохранить метаданные
      try {
        await supabase.storage.from('health-files').remove([storagePath]);
      } catch (e) {
        console.warn('Failed to cleanup storage after DB error:', e);
      }
      throw new Error(insertError.message || 'Ошибка сохранения в базу данных');
    }
    
    return data;
  };

  const handleSave = async () => {
    // Если нет новых файлов, просто закрываем
    if (files.length === 0) {
      onSave(uploadedFiles);
      onClose();
      return;
    }

    // Проверяем userId
    if (!userId) {
      setError('Ошибка: пользователь не авторизован');
      return;
    }

    setIsUploading(true);
    setError('');

    const newUploadedFiles = [];
    let hasErrors = false;

    for (const file of files) {
      try {
        // Обновляем статус на "uploading"
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' } : f
        ));

        // Загружаем в Storage
        const storagePath = await uploadFileToStorage(file);

        // Сохраняем метаданные в БД
        const savedFile = await saveFileMetadata(file, storagePath);
        newUploadedFiles.push(savedFile);

        // Обновляем статус на "uploaded"
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploaded' } : f
        ));

      } catch (err) {
        console.error('Error uploading file:', err);
        hasErrors = true;
        
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ));
        
        setError(err.message || 'Ошибка загрузки файла');
      }
    }

    setIsUploading(false);

    // Если все файлы загружены успешно
    if (newUploadedFiles.length > 0) {
      const allFiles = [...uploadedFiles, ...newUploadedFiles];
      setUploadedFiles(allFiles);
      
      // Убираем успешно загруженные файлы из списка новых
      setFiles(prev => prev.filter(f => f.status !== 'uploaded'));
      
      // Если нет ошибок, закрываем модал
      if (!hasErrors) {
        onSave(allFiles);
        onClose();
      } else {
        // Обновляем родителя о новых файлах, но не закрываем
        onSave(allFiles);
      }
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    
    setFiles([]);
    setError('');
    onClose();
  };

  // Иконка файла по типу
  const getFileIcon = (type) => {
    const isPdf = type === 'application/pdf' || type === 'pdf';
    
    if (isPdf) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#DC2626" stroke="#DC2626" strokeWidth="2"/>
          <polyline points="14 2 14 8 20 8" stroke="white" strokeWidth="2"/>
          <text x="12" y="17" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">PDF</text>
        </svg>
      );
    }
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="2" fill="#3B82F6"/>
        <circle cx="8" cy="8" r="2" fill="white"/>
        <path d="M22 14l-5-5-9 9" stroke="white" strokeWidth="2"/>
      </svg>
    );
  };

  // Иконка статуса загрузки
  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return (
          <div className="upload-spinner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
          </div>
        );
      case 'uploaded':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Загрузка анализов">
      <div className="upload-content">
        <div 
          className={`upload-zone ${isUploading ? 'disabled' : ''}`} 
          onClick={() => !isUploading && inputRef.current?.click()}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p className="upload-zone-text">Нажмите для выбора файлов</p>
          <p className="upload-zone-hint">PDF, JPG или PNG до 10 МБ</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.PDF,.jpg,.JPG,.jpeg,.JPEG,.png,.PNG,application/pdf,image/jpeg,image/png"
            multiple
            onChange={handleFileSelect}
            className="upload-input"
            disabled={isUploading}
          />
        </div>

        {error && <p className="upload-error">{error}</p>}

        {/* Уже загруженные файлы в Supabase */}
        {uploadedFiles.length > 0 && (
          <div className="upload-files">
            <h4 className="upload-files-title">✅ Загруженные анализы ({uploadedFiles.length})</h4>
            <div className="upload-files-list">
              {uploadedFiles.map(file => (
                <div key={file.id} className="upload-file uploaded">
                  <div className="upload-file-icon">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="upload-file-info">
                    <span className="upload-file-name">{file.file_name}</span>
                    <span className="upload-file-size">{formatFileSize(file.file_size)}</span>
                  </div>
                  <button 
                    className="upload-file-remove"
                    onClick={() => handleRemoveUploaded(file.id, file.file_path)}
                    disabled={isUploading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Новые файлы для загрузки */}
        {files.length > 0 && (
          <div className="upload-files">
            <h4 className="upload-files-title">📎 Новые файлы ({files.length})</h4>
            <div className="upload-files-list">
              {files.map(file => (
                <div key={file.id} className={`upload-file ${file.status}`}>
                  <div className="upload-file-icon">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="upload-file-info">
                    <span className="upload-file-name">{file.name}</span>
                    <span className="upload-file-size">{formatFileSize(file.size)}</span>
                  </div>
                  {file.status === 'pending' ? (
                    <button 
                      className="upload-file-remove"
                      onClick={() => handleRemove(file.id)}
                      disabled={isUploading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  ) : (
                    <div className="upload-file-status">
                      {getStatusIcon(file.status)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="upload-actions">
          <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
            {uploadedFiles.length > 0 && files.length === 0 ? 'Закрыть' : 'Отмена'}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isUploading || (files.length === 0 && uploadedFiles.length === 0)}
          >
            {isUploading ? 'Загрузка...' : files.length > 0 ? 'Загрузить' : 'Готово'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
