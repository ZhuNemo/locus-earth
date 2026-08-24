        let toastTimeout = null;
        const toast = document.getElementById('toastMessage');

        export function showToast(text, duration = 4000) {
            toast.textContent = text;
            toast.classList.add('show');
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }

        export function closeInfo() {
            document.getElementById('infoModal').classList.remove('active');
        }
        export function closeIterlog() {
            document.getElementById('iterlogModal').classList.remove('active');
        }