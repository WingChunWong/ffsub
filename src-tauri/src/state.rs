use std::process::Child;
use std::sync::Mutex;

/// 应用全局编码状态，由 Tauri 状态管理
pub struct AppState {
    pub running: Mutex<bool>,
    pub child: Mutex<Option<Child>>,
    /// 视频总时长（秒），用于计算进度百分比
    pub total_duration: Mutex<f64>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            running: Mutex::new(false),
            child: Mutex::new(None),
            total_duration: Mutex::new(0.0),
        }
    }

    pub fn is_running(&self) -> Result<bool, String> {
        self.running
            .lock()
            .map(|guard| *guard)
            .map_err(|e| format!("锁竞争错误: {e}"))
    }

    pub fn set_running(&self, value: bool) -> Result<(), String> {
        let mut guard = self.running.lock().map_err(|e| format!("锁竞争错误: {e}"))?;
        *guard = value;
        Ok(())
    }

    pub fn store_child(&self, child: Child) -> Result<(), String> {
        let mut guard = self.child.lock().map_err(|e| format!("锁竞争错误: {e}"))?;
        *guard = Some(child);
        Ok(())
    }

    pub fn take_child(&self) -> Result<Option<Child>, String> {
        let mut guard = self.child.lock().map_err(|e| format!("锁竞争错误: {e}"))?;
        Ok(guard.take())
    }

    pub fn set_total_duration(&self, duration: f64) -> Result<(), String> {
        let mut guard = self
            .total_duration
            .lock()
            .map_err(|e| format!("锁竞争错误: {e}"))?;
        *guard = duration;
        Ok(())
    }

    pub fn get_total_duration(&self) -> Result<f64, String> {
        self.total_duration
            .lock()
            .map(|guard| *guard)
            .map_err(|e| format!("锁竞争错误: {e}"))
    }
}
