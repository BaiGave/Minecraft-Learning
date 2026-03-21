/**
 * 批量修复 docs/mc/1.21/tutorials 目录下的链接
 * 所有文件都在 tutorials 目录下，不存在子目录 Part-X-YYY
 */

const fs = require('fs');
const path = require('path');

const TUTORIALS_DIR = path.join(__dirname, 'website', 'docs', 'mc', '1.21', 'tutorials');

// 链接映射：错误的 -> 正确的
const linkMappings = {
    '../Part-1-Foundation/04-registry-system.html': '04-registry-system.html',
    '../Part-1-Foundation/05-client-server-arch.html': '05-client-server-arch.html',
    '../Part-1-Foundation/06-shared-constants.html': '06-shared-constants.html',
    '../Part-2-World/08-world-core.html': '08-world-core.html',
    '../Part-2-World/10-biome-system.html': '10-biome-system.html',
    '../Part-3-Block-Item/14-block-basics.html': '14-block-basics.html',
    '../Part-3-Block-Item/15-block-state.html': '15-block-state.html',
    '../Part-3-Block-Item/16-block-entity.html': '16-block-entity.html',
    '../Part-3-Block-Item/17-item-basics.html': '17-item-basics.html',
    '../Part-3-Block-Item/18-item-stack.html': '18-item-stack.html',
    '../Part-3-Block-Item/19-item-component.html': '19-item-component.html',
    '../Part-4-Entity/20-entity-intro.html': '20-entity-intro.html',
    '../Part-4-Entity/21-entity-lifecycle.html': '21-entity-lifecycle.html',
    '../Part-4-Entity/22-living-entity.html': '22-living-entity.html',
    '../Part-4-Entity/23-mob-entity.html': '23-mob-entity.html',
    '../Part-4-Entity/24-entity-attributes.html': '24-entity-attributes.html',
    '../Part-4-Entity/25-damage-system.html': '25-damage-system.html',
    '../Part-4-Entity/26-spawn-system.html': '26-spawn-system.html',
    '../Part-5-AI/27-ai-brain-intro.html': '27-ai-brain-intro.html',
    '../Part-5-AI/28-memory-system.html': '28-memory-system.html',
    '../Part-5-AI/29-sensor-system.html': '29-sensor-system.html',
    '../Part-5-AI/30-task-system.html': '30-task-system.html',
    '../Part-5-AI/31-activity-schedule.html': '31-activity-schedule.html',
    '../Part-5-AI/32-pathfinding.html': '32-pathfinding.html',
    '../Part-6-Network/33-network-intro.html': '33-network-intro.html',
    '../Part-6-Network/34-packet-system.html': '34-packet-system.html',
    '../Part-6-Network/35-protocol-states.html': '35-protocol-states.html',
    '../Part-6-Network/36-sync-mechanism.html': '36-sync-mechanism.html',
    '../Part-7-Command/37-command-intro.html': '37-command-intro.html',
    '../Part-7-Command/38-brigadier-basics.html': '38-brigadier-basics.html',
    '../Part-7-Command/39-custom-command.html': '39-custom-command.html',
    '../Part-7-Command/40-command-advanced.html': '40-command-advanced.html',
    '../Part-8-Resource/40-resource-pack.html': '40-resource-pack.html',
    '../Part-8-Resource/41-datapack-intro.html': '41-datapack-intro.html',
    '../Part-8-Resource/42-loot-table.html': '42-loot-table.html',
    '../Part-8-Resource/43-advancement.html': '43-advancement.html',
    '../Part-8-Resource/44-recipe-system.html': '44-recipe-system.html',
    '../Part-9-Client/45-minecraft-client.html': '45-minecraft-client.html',
    '../Part-9-Client/46-render-system.html': '46-render-system.html',
    '../Part-9-Client/47-gui-system.html': '47-gui-system.html',
    '../Part-9-Client/48-input-handling.html': '48-input-handling.html',
    '../Part-10-Server/49-server-intro.html': '49-server-intro.html',
    '../Part-10-Server/50-player-manager.html': '50-player-manager.html',
    '../Part-10-Server/51-save-system.html': '51-save-system.html',
    '../Part-10-Server/52-dedicated-vs-integrated.html': '52-dedicated-vs-integrated.html',
    '../Part-11-Advanced/53-datafixer.html': '53-datafixer.html',
    '../Part-11-Advanced/54-fluids.html': '54-fluids.html',
    '../Part-11-Advanced/55-village-system.html': '55-village-system.html',
    '../Part-11-Advanced/56-raid-system.html': '56-raid-system.html',
    '../Part-11-Advanced/57-structure-system.html': '57-structure-system.html',
    '../Part-12-Practice/98-project1-block.html': '98-project1-block.html',
    '../Part-12-Practice/99-project2-item.html': '99-project2-item.html',
    '../Part-12-Practice/100-project3-entity.html': '100-project3-entity.html',
    '../Part-12-Practice/101-project4-datapack.html': '101-project4-datapack.html',
    '../README.html': 'README.html',
    // 处理 ./Part-X-YYY/ 格式的链接
    './Part-3-Block-Item/18-item-stack.html': '18-item-stack.html',
    './Part-3-Block-Item/19-item-component.html': '19-item-component.html',
    './Part-3-Block-Item/16-block-entity.html': '16-block-entity.html',
    './Part-10-Server/51-save-system.html': '51-save-system.html',
    // 处理 ../Part-X-YYY/ 格式的链接（额外匹配）
    '../Part-4-Entity/21-entity-lifecycle.html': '21-entity-lifecycle.html',
    '../Part-4-Entity/22-living-entity.html': '22-living-entity.html',
    '../Part-8-Resource/40-resource-pack.html': '40-resource-pack.html',
    '../Part-8-Resource/41-datapack-intro.html': '41-datapack-intro.html',
};

let filesModified = 0;
let linksFixed = 0;

// 扫描目录
const files = fs.readdirSync(TUTORIALS_DIR).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(TUTORIALS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    for (const [oldLink, newLink] of Object.entries(linkMappings)) {
        const regex = new RegExp(oldLink.replace(/[-\/]/g, '[/\\\\]'), 'g');
        if (regex.test(content)) {
            content = content.replace(regex, newLink);
            modified = true;
            linksFixed++;
            console.log(`  [${file}] ${oldLink} -> ${newLink}`);
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        filesModified++;
    }
});

console.log(`\n修复完成！`);
console.log(`修改文件数: ${filesModified}`);
console.log(`修复链接数: ${linksFixed}`);
