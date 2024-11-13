document.getElementById('filterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const date = document.querySelector('input[name="date"]').value;
    const feedId = document.querySelector('input[name="feedId"]').value;

    const query = new URLSearchParams({ date, feedId }).toString();
    window.location.href = `/dashboard?${query}`;
});
